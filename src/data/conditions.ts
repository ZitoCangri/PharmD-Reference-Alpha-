/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiseaseState } from "../types";

export const CLINICAL_CONDITIONS: DiseaseState[] = [
  {
    id: "hypertension",
    name: "Hypertension (HTN)",
    synonyms: ["high blood pressure", "htn", "high bp", "hypertensive"],
    category: "Cardiovascular",
    clinicalOverview: "Hypertension is a primary risk factor for cardiovascular disease, stroke, and renal failure. According to ACC/AHA guidelines, Stage 1 HTN starts at 130/80 mmHg, and Stage 2 starts at 140/90 mmHg. Treatment strategy emphasizes lifestyle modifications followed by pharmacological therapy customized based on patient comorbidities (e.g., diabetes, chronic kidney disease (CKD)).",
    treatmentGuidelines: "First-line agents for primary hypertension include Thiazide Diuretics, Calcium Channel Blockers (CCBs), ACE Inhibitors, or Angiotensin Receptor Blockers (ARBs). In patients with CKD or diabetes with albuminuria, ACE Inhibitors or ARBs are strongly indicated for renal protection. Do not combine ACEi and ARB due to hyperkalemia and acute kidney injury risk.",
    drugClasses: [
      {
        className: "ACE Inhibitors (ACEi)",
        mechanism: "Inhibits Angiotensin-Converting Enzyme, blocking the conversion of Angiotensin I to the potent vasoconstrictor Angiotensin II. Also prevents breakdown of bradykinin, leading to vasodilation.",
        drugs: [
          { generic: "lisinopril", brand: "Prinivil, Zestril", clinicalPearl: "Highest risk of dry cough (mediated by bradykinin) and angioedema. Check serum creatinine and potassium within 1-2 weeks of initiation." },
          { generic: "enalapril", brand: "Vasotec", clinicalPearl: "Available in IV format (enalaprilat) for severe inpatient hypertensive urgency. Monitor renal clearance." },
          { generic: "ramipril", brand: "Altace", clinicalPearl: "Highly lipophilic with strong clinical evidence for cardiovascular mortality reduction (HOPE trial)." }
        ]
      },
      {
        className: "Angiotensin II Receptor Blockers (ARBs)",
        mechanism: "Selectively blocks Angiotensin II type 1 (AT1) receptors, preventing the vasoconstricting and aldosterone-secreting effects of Angiotensin II.",
        drugs: [
          { generic: "losartan", brand: "Cozaar", clinicalPearl: "Uricosuric effect (lowers uric acid); beneficial in comorbid gout. Shorter half-life compared to other ARBs; sometimes requires BID dosing." },
          { generic: "valsartan", brand: "Diovan", clinicalPearl: "Strong guideline indication in post-MI and HFrEF. Doses range from 40mgBID up to 160mgBID for CHF." },
          { generic: "olmesartan", brand: "Benicar", clinicalPearl: "Associated with a rare sprue-like enteropathy causing severe chronic diarrhea months to years after initiation." }
        ]
      },
      {
        className: "Calcium Channel Blockers (CCBs) - Dihydropyridine",
        mechanism: "Blocks L-type calcium channels in vascular smooth muscle, causing peripheral vasodilation and decreased systemic vascular resistance.",
        drugs: [
          { generic: "amlodipine", brand: "Norvasc", clinicalPearl: "Excellent 24-hour coverage. Very common side effect is dose-dependent peripheral edema (ankle swelling). Avoid non-DHP CCBs in heart failure." },
          { generic: "nifedipine XL", brand: "Procardia XL, Adalat CC", clinicalPearl: "Must use extended-release formulations for HTN. Immediate-release nifedipine is contraindicated in HTN due to severe reflex tachycardia and mortality." }
        ]
      },
      {
        className: "Thiazide & Thiazide-Like Diuretics",
        mechanism: "Inhibits sodium and chloride reabsorption in the distal convoluted tubule, increasing excretion of sodium, chloride, and water.",
        drugs: [
          { generic: "hydrochlorothiazide", brand: "Microzide, HCTZ", clinicalPearl: "Commonly used in fixed-dose combinations. Can cause hypokalemia, hyponatremia, hypercalcemia, hyperuricemia, and hyperglycemia." },
          { generic: "chlorthalidone", brand: "Thalitone", clinicalPearl: "Longer half-life and greater potency than HCTZ. Preferred by ACC/AHA guidelines based on ALLHAT clinical trial evidence." }
        ]
      }
    ]
  },
  {
    id: "diabetes_mellitus",
    name: "Type 2 Diabetes Mellitus (T2DM)",
    synonyms: ["diabetes", "t2dm", "high blood sugar", "hyperglycemia", "diabetic"],
    category: "Endocrine & Metabolic",
    clinicalOverview: "Type 2 Diabetes mellitus is characterized by progressive insulin resistance and beta-cell dysfunction. According to ADA Standards of Care, a patient-centered approach dictates selection of therapy based on cardiorenal comorbidities (Atherosclerotic Cardiovascular Disease (ASCVD), Heart Failure (HF), Chronic Kidney Disease (CKD)), glycemic efficacy, weight management needs, and hipoglycemia risk.",
    treatmentGuidelines: "Metformin remains a traditional first-line therapy unless contraindicated (e.g., eGFR < 30 mL/min). However, in patients with established ASCVD, high cardiovascular risk, HF, or CKD, GLP-1 Receptor Agonists or SGLT2 Inhibitors with proven cardiorenal benefit should be introduced early, independent of baseline A1C.",
    drugClasses: [
      {
        className: "Biguanides",
        mechanism: "Decreases hepatic gluconeogenesis, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.",
        drugs: [
          { generic: "metformin", brand: "Glucophage, Fortamet", clinicalPearl: "Contraindicated in eGFR < 30. Risk of lactic acidosis. Common GI side effects; minimize by slow titration and food intake. Long-term use can cause Vitamin B12 deficiency." }
        ]
      },
      {
        className: "SGLT2 Inhibitors",
        mechanism: "Inhibits sodium-glucose co-transporter 2 (SGLT2) in proximal renal tubules, reducing renal threshold for glucose and promoting glucose and sodium excretion in urine.",
        drugs: [
          { generic: "empagliflozin", brand: "Jardiance", clinicalPearl: "Proven reductions in CV mortality (EMPA-REG OUTCOME) and HF hospitalizations. Risk of genitourinary tract infections, volume depletion, and rare euglycemic diabetic ketoacidosis (DKA)." },
          { generic: "dapagliflozin", brand: "Farxiga", clinicalPearl: "Indicated for T2DM, HFrEF, and CKD preservation. Ensure adequate hydration and perineal hygiene." }
        ]
      },
      {
        className: "GLP-1 Receptor Agonists",
        mechanism: "Mimics glucagon-like peptide-1 hormone to enhance glucose-dependent insulin secretion, suppress glucagon secretion, slow gastric emptying, and increase satiety.",
        drugs: [
          { generic: "semaglutide", brand: "Ozempic, Rybelsus, Wegovy", clinicalPearl: "Highest glycemic efficacy and superior weight loss. Black box warning: Personal or family history of Medullary Thyroid Carcinoma (MTC) or MEN2. Risk of pancreatitis." },
          { generic: "liraglutide", brand: "Victoza, Saxenda", clinicalPearl: "Daily subcutaneous injection. Demonstrated cardiac safety in the LEADER trial." }
        ]
      },
      {
        className: "DPP-4 Inhibitors",
        mechanism: "Inhibits dipeptidyl peptidase-4 (DPP-4) enzyme, slowing the enzyme inactivation of incretin hormones (GLP-1 and GIP) to elevate endogenous levels.",
        drugs: [
          { generic: "sitagliptin", brand: "Januvia", clinicalPearl: "Weight neutral, low hypoglycemia risk. Dose adjust for renal impairment. Avoid combining with GLP-1 agonists due to overlapping pathways." },
          { generic: "saxagliptin", brand: "Onglyza", clinicalPearl: "Associated with increased risk of heart failure hospitalizations (SAVOR-TIMI trial); generally avoided in HF patients." }
        ]
      }
    ]
  },
  {
    id: "hyperlipidemia",
    name: "Hyperlipidemia (Dyslipidemia)",
    synonyms: ["high cholesterol", "cholesterol", "hyperlipidemia", "dyslipidemia", "ldl", "lipids"],
    category: "Cardiovascular",
    clinicalOverview: "Hyperlipidemia involves elevation of plasma cholesterol, triglycerides, or both, contributing to atherosclerosis and ASCVD. Primary target of therapy is Low-Density Lipoprotein Cholesterol (LDL-C). A 50% or greater reduction in LDL-C is typical for high-intensity statin therapy in secondary prevention.",
    treatmentGuidelines: "Statins are the cornerstone of lipid management. In very high-risk ASCVD patients with LDL-C >= 70 mg/dL despite max-tolerated statins, ezetimibe should be added first, followed by a PCSK9 inhibitor if necessary. Prioritize checking fasting lipids 4-12 weeks after initiation or dosage adjustment.",
    drugClasses: [
      {
        className: "HMG-CoA Reductase Inhibitors (Statins)",
        mechanism: "Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, the rate-limiting enzyme in cholesterol biosynthesis, upregulating LDL receptors on hepatocytes.",
        drugs: [
          { generic: "atorvastatin", brand: "Lipitor", clinicalPearl: "High-intensity doses: 40-80 mg daily. Excellent CV risk reduction data. Can be taken any time of day due to prolonged active half-life." },
          { generic: "rosuvastatin", brand: "Crestor", clinicalPearl: "High-intensity doses: 20-40 mg daily. Hydrophilic statin; sometimes tolerated better in patients experiencing statin-associated muscle symptoms (SAMS) with lipophilic statins." },
          { generic: "simvastatin", brand: "Zocor", clinicalPearl: "Moderate-intensity statin. High-dose (80 mg) is restricted due to elevated rhabdomyolysis risk. Major CYP3A4 interactions; do not exceed 10mg with amlodipine." }
        ]
      },
      {
        className: "Cholesterol Absorption Inhibitors",
        mechanism: "Inhibits cholesterol absorption at the brush border of the small intestine by targeting the Niemann-Pick C1-Like 1 (NPC1L1) transporter protein.",
        drugs: [
          { generic: "ezetimibe", brand: "Zetia", clinicalPearl: "Provides an additional 15-20% reduction in LDL-C when added to statin therapy (IMPROVE-IT trial). Well-tolerated with minimal systemic side effects." }
        ]
      }
    ]
  },
  {
    id: "asthma_copd",
    name: "Asthma & Chronic Obstructive Pulmonary Disease (COPD)",
    synonyms: ["asthma", "copd", "emphysema", "bronchitis", "wheezing", "shortness of breath", "pulmonary"],
    category: "Pulmonary",
    clinicalOverview: "Asthma is characterized by reversible chronic airway inflammation and bronchial hyperresponsiveness. COPD involves persistent, progressive airflow limitation, usually linked to tobacco smoke. Treatment guidelines focus on bronchodilation and symptom/exacerbation reduction.",
    treatmentGuidelines: "Asthma guidelines (GINA) no longer recommend SABA-only treatment; an inhaled corticosteroid (ICS)-formoterol combination is the preferred rescue option. COPD guidelines (GOLD) elevate Long-Acting Muscarinic Antagonists (LAMA) and Long-Acting Beta Agonists (LABA) as initial therapies (Group A/B/E).",
    drugClasses: [
      {
        className: "Short-Acting Beta-2 Agonists (SABA)",
        mechanism: "Relaxes bronchial smooth muscle by action on beta-2 receptors, causing rapid bronchodilation.",
        drugs: [
          { generic: "albuterol", brand: "Ventolin, ProAir, Proventil", clinicalPearl: "Traditional rescue inhaler. Common adverse effects include tremor, tachycardia, palpitations, and transient hypokalemia." },
          { generic: "levalbuterol", brand: "Xopenex", clinicalPearl: "R-enantiomer of albuterol. Hypothesized to produce less tachycardia, though clinical trials display minor difference compared to generic albuterol." }
        ]
      },
      {
        className: "Long-Acting Muscarinic Antagonists (LAMA)",
        mechanism: "Blocks M3 acetylcholine receptors in bronchial smooth muscle, preventing vagally-mediated bronchoconstriction.",
        drugs: [
          { generic: "tiotropium", brand: "Spiriva", clinicalPearl: "First-line maintenance therapy for COPD. Administered via dry powder (HandiHaler) or soft mist (Respimat). Side effects: dry mouth, urinary retention." },
          { generic: "umeclidinium", brand: "Incruse Ellipta", clinicalPearl: "Once-daily dry powder inhaler used for COPD maintenance. Excellent compliance profile." }
        ]
      },
      {
        className: "Inhaled Corticosteroids (ICS)",
        mechanism: "Suppresses local pulmonary inflammatory pathways, reducing mucosal edema, capillary permeability, and inflammatory mediator release.",
        drugs: [
          { generic: "fluticasone propionate", brand: "Flovent HFA, Flovent Diskus", clinicalPearl: "Maintenance therapy for asthma. Counsel patients to rinse and spit after each use to prevent oral candidiasis (thrush)." },
          { generic: "budesonide", brand: "Pulmicort", clinicalPearl: "Available in Respules formulation for nebulizers, commonly used in pediatric asthma maintenance." }
        ]
      }
    ]
  },
  {
    id: "heart_failure",
    name: "Heart Failure with Reduced Ejection Fraction (HFrEF)",
    synonyms: ["heart failure", "hf", "hfref", "congestive heart failure", "chf"],
    category: "Cardiovascular",
    clinicalOverview: "Heart failure with reduced ejection fraction occurs when LVEF <= 40%. Direct management focuses on blocking neurohormonal compensatory pathways that cause maladaptive cardiac remodeling.",
    treatmentGuidelines: "Guideline-Directed Medical Therapy (GDMT) mandates 4 foundational classes ('The Four Pillars'): (1) ARNI, ACEi, or ARB (ARNI preferred); (2) Evidence-based Beta Blockers; (3) Mineralocorticoid Receptor Antagonists (MRA); (4) SGLT2 Inhibitors. Titrate doses to maximum tolerated guideline targets.",
    drugClasses: [
      {
        className: "Angiotensin Receptor-Neprilysin Inhibitor (ARNI)",
        mechanism: "Combination of sacubitril (inhibits neprilysin to raise beneficial natriuretic peptides) and valsartan (blocks AT1 receptor to offset sacubitril-induced vasoconstriction).",
        drugs: [
          { generic: "sacubitril / valsartan", brand: "Entresto", clinicalPearl: "Preferred agent over ACE/ARB. Requires a 36-hour washout period when switching from an ACE inhibitor to avoid severe angioedema risk." }
        ]
      },
      {
        className: "Cardiovascular Beta-Blockers (HF Evidence-Based)",
        mechanism: "Blocks clinical beta-1 receptors to counter hyper-sympathetic activation, slow heart rate, reduce myocardial oxygen demand, and inhibit cardiac remodeling.",
        drugs: [
          { generic: "metoprolol succinate", brand: "Toprol-XL", clinicalPearl: "Must use succinate (extended-release), NOT metoprolol tartrate (immediate-release). Tartrate lacks clinical data for CV mortality reduction in heart failure." },
          { generic: "carvedilol", brand: "Coreg", clinicalPearl: "Non-selective beta-blocker with alpha-1 blockade. Provides systemic vasodilation helping to lower BP, but carries higher risk of orthostasis. Take with food." }
        ]
      },
      {
        className: "Mineralocorticoid Receptor Antagonists (MRA)",
        mechanism: "Blocks aldosterone from binding to receptors in distal tubules, reducing sodium and water retention and mitigating aldosterone-induced myocardial fibrosis.",
        drugs: [
          { generic: "spironolactone", brand: "Aldactone", clinicalPearl: "Non-selective; blocks progesterone and androgen. Can cause gynecomastia in males. Monitor potassium closely; hold if K > 5.0." },
          { generic: "eplerenone", brand: "Inspra", clinicalPearl: "Selective aldosterone blocker. Does not cause gynecomastia. More expensive but excellent alternative if spironolactone is poorly tolerated." }
        ]
      }
    ]
  },
  {
    id: "gerd_peptic_ulcer",
    name: "Gastroesophageal Reflux Disease (GERD) & Acid-Peptic Disorders",
    synonyms: ["gerd", "acid reflux", "reflux", "heartburn", "ulcer", "peptic ulcer", "stomach acid"],
    category: "Gastrointestinal",
    clinicalOverview: "GERD occurs when gastric contents reflux into the esophagus. Acid-peptic disease also encompasses gastric and duodenal ulcers. Treatment centers on limiting gastric acid secretion to facilitate esophageal/gastric mucosal healing.",
    treatmentGuidelines: "PPIs are the most potent acid suppressors and are first-line for moderate-to-severe symptoms or esophagitis. Limit therapy to the shortest duration necessary (typically 4-8 weeks) to mitigate potential long-term risks.",
    drugClasses: [
      {
        className: "Proton Pump Inhibitors (PPIs)",
        mechanism: "Covalently binds to H+/K+ ATPase enzyme pumps (proton pumps) in parietal cells, permanently inactivating the final step of gastric acid secretion.",
        drugs: [
          { generic: "omeprazole", brand: "Prilosec", clinicalPearl: "Inhibits CYP2C19. Avoid co-administration with clopidogrel (Plavix) as it prevents activation of the prodrug. Take 30-60 minutes before first meal." },
          { generic: "pantoprazole", brand: "Protonix", clinicalPearl: "Commonly used in acute hospital settings (has IV formulation). Lower risk of CYP2C19 clopidogrel interaction compared to omeprazole." },
          { generic: "esomeprazole", brand: "Nexium", clinicalPearl: "S-isomer of omeprazole. Sightly higher potency. Long-term PPI risks include hypomagnesemia, osteoporosis fracture risk, B12 deficiency, and C. diff-associated diarrhea." }
        ]
      },
      {
        className: "H2-Receptor Antagonists (H2RAs)",
        mechanism: "Reversibly blocks histamine-2 receptors on gastric parietal cells, inhibiting basal and stimulated acid secretion.",
        drugs: [
          { generic: "famotidine", brand: "Pepcid", clinicalPearl: "First-line choice for mild acid reflux. High dose adjustment necessary in renal impairment to avoid CNS side effects (confusion, hallucination)." }
        ]
      }
    ]
  },
  {
    id: "depression",
    name: "Major Depressive Disorder (MDD)",
    synonyms: ["depression", "depressive", "mdd", "anxiety", "antidepressant"],
    category: "Psychiatry & Neurology",
    clinicalOverview: "Major Depressive Disorder is characterized by persistent depressed mood, anhedonia, and functional impairment. Standard monotherapy addresses deficits in monoaminergic neurotransmitters (Serotonin, Norepinephrine, Dopamine).",
    treatmentGuidelines: "SSRIs are standard first-line therapies. Selection is guided by drug-drug interactions, side effect profile (e.g., sedation vs. activation), and patient history. Ensure a 4-6 week trial at therapeutic doses to assess efficacy.",
    drugClasses: [
      {
        className: "Selective Serotonin Reuptake Inhibitors (SSRIs)",
        mechanism: "Selectively inhibits presynaptic serotonin reuptake transporters (SERT), elevating synaptic serotonin concentration and neurotransmission.",
        drugs: [
          { generic: "sertraline", brand: "Zoloft", clinicalPearl: "Preferred for patients with cardiovascular disease (SADHEART trial). Often causes GI distress ('squirt-raline') early in therapy; titration helps." },
          { generic: "escitalopram", brand: "Lexapro", clinicalPearl: "Highly selective; low drug interaction potential. Risk of dose-dependent QTe prolongation; maximum daily dose 20mg (10mg in geriatrics)." },
          { generic: "fluoxetine", brand: "Prozac", clinicalPearl: "Extremely long half-life (active metabolite up to 2 weeks); has lowest withdrawal syndromic risk. Helpful in patients with irregular compliance." }
        ]
      },
      {
        className: "Atypical Antidepressants",
        mechanism: "Inhibits both norepinephrine and dopamine reuptake (NDRI) or blocks specific central alpha/serotonin receptors.",
        drugs: [
          { generic: "bupropion", brand: "Wellbutrin", clinicalPearl: "NDRI. Does not cause sexual dysfunction or weight gain (frequently causes weight loss). Strictly contraindicated in seizure disorders and eating disorders due to lowering of seizure threshold." },
          { generic: "mirtazapine", brand: "Remeron", clinicalPearl: "Central alpha-2 antagonist. Low doses (7.5-15mg) promote heavy sedation and weight gain (appetite stimulant). Higher doses are more noradrenergic and less sedating." }
        ]
      }
    ]
  }
];
