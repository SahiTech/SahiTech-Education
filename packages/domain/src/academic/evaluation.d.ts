export type QawmiDharja = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool' | 'rasib';
export interface DharjaScale {
    dharja: QawmiDharja;
    nameBn: string;
    nameEn: string;
    nameAr: string;
    minPercent: number;
    maxPercent: number;
}
export declare const QAWMI_DHARJA_SCALES: DharjaScale[];
export declare function calculateQawmiDharja(obtainedMarks: number, totalMarks: number): DharjaScale;
