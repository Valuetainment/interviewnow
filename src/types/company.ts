// Types for normalized company data structures

export interface CompanyBenefitsData {
  description: string;
  items: string[];
}

export interface CompanyValuesData {
  description: string;
  items: string[];
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  about: string | null;
  mission: string | null;
  vision: string | null;
  culture: string | null;
  story: string | null;
  benefits_data: CompanyBenefitsData;
  values_data: CompanyValuesData;
  created_at: string;
  updated_at: string;
}
