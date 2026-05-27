/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DrugIngredient {
  rxcui: string;
  name: string;
  relation: string;
}

export interface NormalizedDrug {
  originalQuery: string;
  rxcui: string;
  normalizedName: string;
  activeIngredients: string[];
  allIngredients: DrugIngredient[];
  isFallback?: boolean;
}

export interface openFDALabel {
  // Brand & Generic Meta
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  pharm_class_epc?: string[];
  pharm_class_pe?: string[];
  route?: string[];
  product_ndc?: string[];
  spl_id?: string;
  unii?: string[];

  // Monograph Core Content Fields
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  dosage_forms_and_strengths?: string[];
  contraindications?: string[];
  warnings_and_cautions?: string[];
  boxed_warning?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  use_in_specific_populations?: string[];
  pregnancy?: string[];
  nursing_mothers?: string[];
  pediatric_use?: string[];
  geriatric_use?: string[];
  description?: string[];
  clinical_pharmacology?: string[];
  mechanism_of_action?: string[];
  pharmacodynamics?: string[];
  pharmacokinetics?: string[];
  nonclinical_toxicology?: string[];
  clinical_studies?: string[];
  how_supplied?: string[]; // how_supplied_and_storage_and_handling
  storage_and_handling?: string[];
  patient_counseling_information?: string[];
  overdosage?: string[];
}

export interface MonographSection {
  id: string;
  title: string;
  content: string | string[];
  category: 'core' | 'mechanism' | 'safety' | 'administration' | 'populations' | 'info';
}

export interface DrugClassMapping {
  className: string;
  mechanism: string;
  drugs: {
    generic: string;
    brand: string;
    clinicalPearl: string;
  }[];
}

export interface DiseaseState {
  id: string;
  name: string;
  synonyms: string[];
  category: string;
  clinicalOverview: string;
  treatmentGuidelines: string;
  drugClasses: DrugClassMapping[];
}
