import { AliaGradeLevel, LocalizedString } from './types';
export interface AliaClass {
    id: string;
    code: string;
    name: LocalizedString;
    tier: 'ebtedayee' | 'dakhil' | 'alim' | 'fazil' | 'kamil';
    numericGradeEquivalent: number;
}
export declare const ALIA_CLASSES: AliaClass[];
export declare const ALIA_GRADE_SCALE: AliaGradeLevel[];
export declare function calculateAliaGpa(marks: number): AliaGradeLevel;
