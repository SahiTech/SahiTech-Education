import { AliaGradeLevel, LocalizedString } from './types';

export interface AliaClass {
  id: string;
  code: string;
  name: LocalizedString;
  tier: 'ebtedayee' | 'dakhil' | 'alim' | 'fazil' | 'kamil';
  numericGradeEquivalent: number;
}

export const ALIA_CLASSES: AliaClass[] = [
  { id: 'ebt_1', code: 'EBT-1', name: { bn: 'ইবতেদায়ি ১ম শ্রেণি', en: 'Ebtedayee Class 1', ar: 'الصف الأول الابتدائي' }, tier: 'ebtedayee', numericGradeEquivalent: 1 },
  { id: 'ebt_2', code: 'EBT-2', name: { bn: 'ইবতেদায়ি ২য় শ্রেণি', en: 'Ebtedayee Class 2', ar: 'الصف الثاني الابتدائي' }, tier: 'ebtedayee', numericGradeEquivalent: 2 },
  { id: 'ebt_3', code: 'EBT-3', name: { bn: 'ইবতেদায়ি ৩য় শ্রেণি', en: 'Ebtedayee Class 3', ar: 'الصف الثالث الابتدائي' }, tier: 'ebtedayee', numericGradeEquivalent: 3 },
  { id: 'ebt_4', code: 'EBT-4', name: { bn: 'ইবতেদায়ি ৪র্থ শ্রেণি', en: 'Ebtedayee Class 4', ar: 'الصف الرابع الابتدائي' }, tier: 'ebtedayee', numericGradeEquivalent: 4 },
  { id: 'ebt_5', code: 'EBT-5', name: { bn: 'ইবতেদায়ি ৫ম শ্রেণি (সমাপনী)', en: 'Ebtedayee Class 5', ar: 'الصف الخامس الابتدائي' }, tier: 'ebtedayee', numericGradeEquivalent: 5 },
  
  { id: 'dak_6', code: 'DAK-6', name: { bn: 'দাখিল ৬ষ্ঠ শ্রেণি', en: 'Dakhil Class 6', ar: 'الصف السادس' }, tier: 'dakhil', numericGradeEquivalent: 6 },
  { id: 'dak_7', code: 'DAK-7', name: { bn: 'দাখিল ৭ম শ্রেণি', en: 'Dakhil Class 7', ar: 'الصف السابع' }, tier: 'dakhil', numericGradeEquivalent: 7 },
  { id: 'dak_8', code: 'DAK-8', name: { bn: 'দাখিল ৮ম শ্রেণি (জেডিসি)', en: 'Dakhil Class 8 (JDC)', ar: 'الصف الثامن' }, tier: 'dakhil', numericGradeEquivalent: 8 },
  { id: 'dak_9', code: 'DAK-9', name: { bn: 'দাখিল ৯ম শ্রেণি', en: 'Dakhil Class 9', ar: 'الصف التاسع' }, tier: 'dakhil', numericGradeEquivalent: 9 },
  { id: 'dak_10', code: 'DAK-10', name: { bn: 'দাখিল ১০ম শ্রেণি (দাখিল সমাপনী)', en: 'Dakhil Class 10 (Dakhil)', ar: 'الصف العاشر' }, tier: 'dakhil', numericGradeEquivalent: 10 },

  { id: 'alm_11', code: 'ALM-11', name: { bn: 'আলিম ১ম বর্ষ', en: 'Alim 1st Year', ar: 'الصف الحادي عشر (عالم)' }, tier: 'alim', numericGradeEquivalent: 11 },
  { id: 'alm_12', code: 'ALM-12', name: { bn: 'আলিম ২য় বর্ষ (আলিম সমাপনী)', en: 'Alim 2nd Year', ar: 'الصف الثاني عشر (عالم)' }, tier: 'alim', numericGradeEquivalent: 12 },

  { id: 'faz_deg', code: 'FAZ-DEG', name: { bn: 'ফাযিল (স্নাতক পাস/অনার্স)', en: 'Fazil (Undergraduate)', ar: 'مرحلة الفاضل (بكالوريوس)' }, tier: 'fazil', numericGradeEquivalent: 15 },
  { id: 'kam_mas', code: 'KAM-MAS', name: { bn: 'কামিল (স্নাতকোত্তর/মাস্টার্স)', en: 'Kamil (Postgraduate)', ar: 'مرحلة الكامل (ماجستير)' }, tier: 'kamil', numericGradeEquivalent: 16 }
];

export const ALIA_GRADE_SCALE: AliaGradeLevel[] = [
  { grade: 'A+', gradePoint: 5.0, marksRange: { min: 80, max: 100 } },
  { grade: 'A', gradePoint: 4.0, marksRange: { min: 70, max: 79 } },
  { grade: 'A-', gradePoint: 3.5, marksRange: { min: 60, max: 69 } },
  { grade: 'B', gradePoint: 3.0, marksRange: { min: 50, max: 59 } },
  { grade: 'C', gradePoint: 2.0, marksRange: { min: 40, max: 49 } },
  { grade: 'D', gradePoint: 1.0, marksRange: { min: 33, max: 39 } },
  { grade: 'F', gradePoint: 0.0, marksRange: { min: 0, max: 32 } }
];

export function calculateAliaGpa(marks: number): AliaGradeLevel {
  for (const scale of ALIA_GRADE_SCALE) {
    if (marks >= scale.marksRange.min && marks <= scale.marksRange.max) {
      return scale;
    }
  }
  return ALIA_GRADE_SCALE[ALIA_GRADE_SCALE.length - 1];
}

