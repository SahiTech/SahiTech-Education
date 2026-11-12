import { QawmiGradeLevel, QawmiMarhala } from './types';
export declare const QAWMI_MARHALAS: QawmiMarhala[];
export declare function calculateQawmiGrade(percentage: number): QawmiGradeLevel;
export declare function getQawmiGradeLabel(grade: QawmiGradeLevel, locale?: 'bn' | 'en' | 'ar'): string;
