
export type ThreatLevel = 'basic' | 'developer' | 'privacy' | 'highValue' | 'institution';

export interface ThreatProfile {
  id: ThreatLevel;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface CategoryThreatMapping {
  categoryId: string;
  basicItems: string[];
  developerItems: string[];
  privacyItems: string[];
  highValueItems: string[];
  institutionItems: string[];
}
