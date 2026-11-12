export type CurriculumType = 'qawmi' | 'alia' | 'hybrid';

export interface LocalizedString {
  bn: string;
  en: string;
  ar?: string;
}

export type QawmiGradeLevel = 
  | 'mumtaz'       // Distinction (80%+)
  | 'jayyid_jiddan'// Very Good (65%-79%)
  | 'jayyid'       // Good (50%-64%)
  | 'maqbool'      // Pass (33%-49%)
  | 'rasib';       // Fail (<33%)

export interface QawmiMarhala {
  id: string;
  code: string;
  name: LocalizedString;
  levelOrder: number;
  description: LocalizedString;
  canonicalKitabs: string[];
}

export interface AliaGradeLevel {
  grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
  gradePoint: number;
  marksRange: { min: number; max: number };
}

export interface AcademicYear {
  id: string;
  tenantId: string;
  name: LocalizedString;
  hijriYear?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

