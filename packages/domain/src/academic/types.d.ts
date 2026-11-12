export type CurriculumType = 'qawmi' | 'alia' | 'hybrid';
export interface LocalizedString {
    bn: string;
    en: string;
    ar?: string;
}
export type QawmiGradeLevel = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool' | 'rasib';
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
    marksRange: {
        min: number;
        max: number;
    };
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
