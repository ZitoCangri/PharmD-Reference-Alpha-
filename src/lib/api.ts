/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedDrug, openFDALabel } from "../types";
import { COMMON_DRUG_MAP } from "../data/drugs";

/**
 * Normalizes a drug name using RxNorm API + Local dictionary fallback.
 * RxNorm allows translating brand names (e.g., Lipitor) to active generic ingredients (e.g., Atorvastatin).
 */
export async function normalizeDrugWithRxNorm(query: string): Promise<NormalizedDrug> {
  const cleanQuery = query.trim().toLowerCase();
  
  // 1. Check local rapid dictionary lookup for immediate, zero-latency precision
  if (COMMON_DRUG_MAP[cleanQuery]) {
    const generic = COMMON_DRUG_MAP[cleanQuery];
    // Split combined ingredients if any (e.g., "acetaminophen / hydrocodone")
    const activeIngredients = generic.split("/").map(s => s.trim());
    return {
      originalQuery: query,
      rxcui: "LOCAL",
      normalizedName: generic,
      activeIngredients,
      allIngredients: activeIngredients.map(name => ({ rxcui: "LOCAL", name, relation: "IN" })),
      isFallback: true
    };
  }

  try {
    // 2. Query RxNorm REST API to find RXCUI for exact name match
    let rxResponse = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(cleanQuery)}`);
    let rxData = await rxResponse.json();
    let rxcui = rxData.idGroup?.rxnormId?.[0];

    // 3. Fallback to Approximate Term (spell checking/suggestions) if exact match fails
    if (!rxcui) {
      const approxResponse = await fetch(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(cleanQuery)}&maxEntries=3`);
      const approxData = await approxResponse.json();
      const candidate = approxData.approximateGroup?.candidate?.[0];
      if (candidate && parseInt(candidate.rxn_accuracy) >= 70) {
        rxcui = candidate.rxcui;
      }
    }

    if (!rxcui) {
      // If RxNorm failed and wasn't in local map, we return original query as active ingredient
      return {
        originalQuery: query,
        rxcui: "NOT_FOUND",
        normalizedName: query,
        activeIngredients: [query],
        allIngredients: [{ rxcui: "NOT_FOUND", name: query, relation: "IN" }]
      };
    }

    // 4. Retrieve Active Ingredients (IN relation) for this RXCUI
    const relatedResponse = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?relation=IN`);
    const relatedData = await relatedResponse.json();
    
    // Support parsing both "allRelatedGroup" and "relatedGroup" RxNorm JSON versions
    const conceptGroupList = relatedData.allRelatedGroup?.conceptGroupList || relatedData.relatedGroup?.conceptGroupList;
    const activeIngredients: string[] = [];
    const allIngredients: { rxcui: string; name: string; relation: string; }[] = [];

    if (conceptGroupList) {
      for (const group of conceptGroupList) {
        if (group.conceptProperties) {
          for (const prop of group.conceptProperties) {
            activeIngredients.push(prop.name.toLowerCase());
            allIngredients.push({
              rxcui: prop.rxcui,
              name: prop.name,
              relation: "IN"
            });
          }
        }
      }
    }

    // 5. If no active ingredients returned (it might be an ingredient itself), find its standard RxNorm normalized name
    if (activeIngredients.length === 0) {
      const propResponse = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`);
      const propData = await propResponse.json();
      const normName = propData.propertyValues?.Value?.[0] || query;
      
      activeIngredients.push(normName.toLowerCase());
      allIngredients.push({
        rxcui,
        name: normName,
        relation: "IN"
      });
    }

    // Return successfully normalized data
    const normalizedName = activeIngredients.join(" / ");
    return {
      originalQuery: query,
      rxcui,
      normalizedName: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
      activeIngredients,
      allIngredients
    };

  } catch (error) {
    console.warn("RxNorm lookup failed or hit CORS. Utilizing strict query fallbacks.", error);
    // In case of any networks/CORS error, do robust baseline fallback using query directly
    return {
      originalQuery: query,
      rxcui: "ERROR_FALLBACK",
      normalizedName: query,
      activeIngredients: [query.toLowerCase()],
      allIngredients: [{ rxcui: "ERROR_FALLBACK", name: query, relation: "IN" }],
      isFallback: true
    };
  }
}

/**
 * Fetches medical data from openFDA Drug Label API.
 * Uses a waterfall strategy: Generic Name Search -> Brand Name Search -> Direct Text Fallback
 */
export async function fetchDrugMonograph(normalized: NormalizedDrug): Promise<{ label: openFDALabel; searchStrategyUsed: string }> {
  const genericList = normalized.activeIngredients;
  const original = normalized.originalQuery.trim();

  // Create search strategies
  const strategies = [
    // 1. Search openfda.generic_name matching ALL active ingredients (precise multi-ingredient search)
    {
      name: "Precise Generic Name Lookup",
      query: genericList.map(g => `openfda.generic_name:"${encodeURIComponent(g)}"`).join("+AND+")
    },
    // 2. Search openfda.generic_name matching the combined generic name directly
    {
      name: "Combined Generic Name Lookup",
      query: `openfda.generic_name:"${encodeURIComponent(normalized.normalizedName.toLowerCase())}"`
    },
    // 3. Search openfda.brand_name matching original brand name
    {
      name: "Brand Name Matches",
      query: `openfda.brand_name:"${encodeURIComponent(original.toLowerCase())}"`
    },
    // 4. Broad generic search
    {
      name: "Broad Generic Term Search",
      query: `generic_name:"${encodeURIComponent(genericList[0])}"`
    },
    // 5. Raw search on full-text index
    {
      name: "Raw Full Text Search Fallback",
      query: `"${encodeURIComponent(genericList[0])}"`
    }
  ];

  for (const strategy of strategies) {
    try {
      const url = `https://api.fda.gov/drug/label.json?search=${strategy.query}&limit=1`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Extract relevant clinical fields from results
          const result = data.results[0];
          
          // Re-map the complex properties to simplify handling
          const label: openFDALabel = {
            brand_name: result.openfda?.brand_name,
            generic_name: result.openfda?.generic_name,
            manufacturer_name: result.openfda?.manufacturer_name,
            pharm_class_epc: result.openfda?.pharm_class_epc,
            pharm_class_pe: result.openfda?.pharm_class_pe,
            route: result.openfda?.route,
            product_ndc: result.openfda?.product_ndc,
            spl_id: result.openfda?.spl_id,
            unii: result.openfda?.unii,
            
            indications_and_usage: result.indications_and_usage,
            dosage_and_administration: result.dosage_and_administration,
            dosage_forms_and_strengths: result.dosage_forms_and_strengths,
            contraindications: result.contraindications,
            warnings_and_cautions: result.warnings_and_cautions,
            boxed_warning: result.boxed_warning,
            adverse_reactions: result.adverse_reactions,
            drug_interactions: result.drug_interactions,
            use_in_specific_populations: result.use_in_specific_populations,
            pregnancy: result.pregnancy,
            nursing_mothers: result.nursing_mothers,
            pediatric_use: result.pediatric_use,
            geriatric_use: result.geriatric_use,
            description: result.description,
            clinical_pharmacology: result.clinical_pharmacology,
            mechanism_of_action: result.mechanism_of_action,
            pharmacodynamics: result.pharmacodynamics,
            pharmacokinetics: result.pharmacokinetics,
            nonclinical_toxicology: result.nonclinical_toxicology,
            clinical_studies: result.clinical_studies,
            how_supplied: result.how_supplied || result.how_supplied_and_storage_and_handling,
            storage_and_handling: result.storage_and_handling,
            patient_counseling_information: result.patient_counseling_information,
            overdosage: result.overdosage
          };
          
          return { label, searchStrategyUsed: strategy.name };
        }
      }
    } catch (e) {
      console.warn(`Strategy '${strategy.name}' failed: `, e);
    }
  }

  throw new Error(`Clinical monograph data could not be retrieved from openFDA for '${normalized.normalizedName}'.`);
}

export interface DrugInteraction {
  drugA: { name: string; rxcui: string };
  drugB: { name: string; rxcui: string };
  severity: "Major" | "Moderate" | "Minor";
  description: string;
  source: string;
}

/**
 * Checks for potential interactions among multiple drugs by their RXCUIs or names.
 * Consults RxNav NIH Rest API with dynamic client-side offline fallbacks.
 */
export async function checkDrugInteractions(normalizedDrugs: NormalizedDrug[]): Promise<DrugInteraction[]> {
  const validDrugs = normalizedDrugs.filter(d => d.rxcui && d.rxcui !== "NOT_FOUND" && d.rxcui !== "ERROR_FALLBACK");
  if (validDrugs.length < 2) return [];

  const rxcuis = validDrugs.map(d => d.rxcui).join("+");
  const localInteractions: DrugInteraction[] = [];

  // Offline/Local lookup database for reliable Zero-Network safety
  const offlineDatabase: { drugs: string[]; severity: "Major" | "Moderate" | "Minor"; description: string }[] = [
    {
      drugs: ["aspirin", "ibuprofen"],
      severity: "Moderate",
      description: "Co-administration may decrease the cardioprotective effects of Aspirin and increase risk of gastrointestinal toxicity/bleeding."
    },
    {
      drugs: ["lisinopril", "spironolactone"],
      severity: "Major",
      description: "Concomitant use may result in clinically dynamic hyperkalemia (high blood potassium), risking cardiac arrhythmias."
    },
    {
      drugs: ["warfarin", "aspirin"],
      severity: "Major",
      description: "Severe risk of life-threatening hemorrhage or increased international normalized ratio (INR) values. Active monitoring required."
    },
    {
      drugs: ["sildenafil", "nitroglycerin"],
      severity: "Major",
      description: "Contraindicated. Severe, sudden, and potentially life-threatening drop in blood pressure (profound hypotension)."
    },
    {
      drugs: ["atorvastatin", "clarithromycin"],
      severity: "Major",
      description: "Clarithromycin is a potent CYP3A4 inhibitor, rising Atorvastatin plasma concentrations, increasing risk of skeletal muscle toxicity or rhabdomyolysis."
    },
    {
      drugs: ["ibuprofen", "warfarin"],
      severity: "Major",
      description: "Nonsteroidal anti-inflammatory drugs (NSAIDs) displace warfarin from albumin, posing a significant risk of internal gastrointestinal bleeding."
    },
    {
      drugs: ["metoprolol", "albuterol"],
      severity: "Moderate",
      description: "Antagonistic pharmacology. Beta-blockers may block the bronchodilatory effects of beta-agonists. Monitor pulmonary status."
    },
    {
      drugs: ["fluoxetine", "tramadol"],
      severity: "Major",
      description: "High risk of serotonin syndrome, characterized by severe cognitive and neuromuscular alterations."
    }
  ];

  // Run local fallback search in parallel
  for (let i = 0; i < validDrugs.length; i++) {
    for (let j = i + 1; j < validDrugs.length; j++) {
      const nameA = validDrugs[i].normalizedName.toLowerCase();
      const nameB = validDrugs[j].normalizedName.toLowerCase();
      
      const matched = offlineDatabase.find(item => 
        (nameA.includes(item.drugs[0]) && nameB.includes(item.drugs[1])) ||
        (nameA.includes(item.drugs[1]) && nameB.includes(item.drugs[0]))
      );
      if (matched) {
        localInteractions.push({
          drugA: { name: validDrugs[i].normalizedName, rxcui: validDrugs[i].rxcui },
          drugB: { name: validDrugs[j].normalizedName, rxcui: validDrugs[j].rxcui },
          severity: matched.severity,
          description: matched.description,
          source: "PharmacoLogic Reference Core (Offline)"
        });
      }
    }
  }

  try {
    // If we have local mock tags, skip http fetch to avoid error logs
    const hasMock = validDrugs.some(d => d.rxcui === "LOCAL");
    if (hasMock) {
      return localInteractions;
    }

    const response = await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis}`);
    if (!response.ok) {
      return localInteractions;
    }
    const data = await response.json();
    const interactionList: DrugInteraction[] = [];

    const typeGroup = data.fullInteractionTypeGroup;
    if (typeGroup && typeGroup.length > 0) {
      for (const group of typeGroup) {
        const sourceName = group.sourceName || "NIH RxNav";
        const types = group.fullInteractionType;
        if (types) {
          for (const type of types) {
            const pairs = type.interactionPair;
            if (pairs) {
              for (const pair of pairs) {
                const concepts = pair.interactionConcept;
                if (concepts && concepts.length >= 2) {
                  const drugAItem = concepts[0].minConceptItem;
                  const drugBItem = concepts[1].minConceptItem;
                  
                  const desc = pair.description || "Interaction details recorded in clinical monographs.";
                  let sev: "Major" | "Moderate" | "Minor" = "Moderate";
                  const rxSeverity = pair.severity ? pair.severity.toLowerCase() : "";

                  if (rxSeverity === "high" || rxSeverity === "critical" || 
                      desc.toLowerCase().includes("severe") || desc.toLowerCase().includes("fatal") ||
                      desc.toLowerCase().includes("contraindicated") || desc.toLowerCase().includes("life-threatening")) {
                    sev = "Major";
                  } else if (desc.toLowerCase().includes("minor") || desc.toLowerCase().includes("mild")) {
                    sev = "Minor";
                  }

                  interactionList.push({
                    drugA: { name: drugAItem.name, rxcui: drugAItem.rxcui },
                    drugB: { name: drugBItem.name, rxcui: drugBItem.rxcui },
                    severity: sev,
                    description: desc,
                    source: `NIH RxNorm Authority (${sourceName})`
                  });
                }
              }
            }
          }
        }
      }
    }

    // Deduplicate and combine with local
    const merged = [...interactionList];
    for (const local of localInteractions) {
      const isDuplicate = merged.some(m => 
        (m.drugA.name.toLowerCase() === local.drugA.name.toLowerCase() && m.drugB.name.toLowerCase() === local.drugB.name.toLowerCase()) ||
        (m.drugA.name.toLowerCase() === local.drugB.name.toLowerCase() && m.drugB.name.toLowerCase() === local.drugA.name.toLowerCase())
      );
      if (!isDuplicate) {
        merged.push(local);
      }
    }

    return merged;
  } catch (err) {
    console.warn("RxNav interaction API request failed, serving local clinical database", err);
    return localInteractions;
  }
}

