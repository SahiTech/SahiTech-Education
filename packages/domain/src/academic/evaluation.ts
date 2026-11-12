export type QawmiDharja = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool' | 'rasib';

export interface DharjaScale {
  dharja: QawmiDharja;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  minPercent: number;
  maxPercent: number;
}

export const QAWMI_DHARJA_SCALES: DharjaScale[] = [
  {
    dharja: 'mumtaz',
    nameBn: 'মুমতাজ (মেধা সহ ১ম বিভাগ)',
    nameEn: 'Mumtaz (Distinction / 1st Class)',
    nameAr: 'ممتاز',
    minPercent: 80,
    maxPercent: 100,
  },
  {
    dharja: 'jayyid_jiddan',
    nameBn: 'জায়্যিদ জিদ্দান (১ম বিভাগ)',
    nameEn: 'Jayyid Jiddan (1st Class)',
    nameAr: 'جيد جداً',
    minPercent: 65,
    maxPercent: 79.99,
  },
  {
    dharja: 'jayyid',
    nameBn: 'জায়্যিদ (২য় বিভাগ)',
    nameEn: 'Jayyid (2nd Class)',
    nameAr: 'جيد',
    minPercent: 50,
    maxPercent: 64.99,
  },
  {
    dharja: 'maqbool',
    nameBn: 'মাকবুল (৩য় বিভাগ)',
    nameEn: 'Maqbool (Pass / 3rd Class)',
    nameAr: 'مقبول',
    minPercent: 33,
    maxPercent: 49.99,
  },
  {
    dharja: 'rasib',
    nameBn: 'রাসেব (অকৃতকার্য)',
    nameEn: 'Rasib (Failed)',
    nameAr: 'راسب',
    minPercent: 0,
    maxPercent: 32.99,
  },
];

export function calculateQawmiDharja(obtainedMarks: number, totalMarks: number): DharjaScale {
  if (totalMarks <= 0) return QAWMI_DHARJA_SCALES[4]; // rasib
  const percent = (obtainedMarks / totalMarks) * 100;

  for (const scale of QAWMI_DHARJA_SCALES) {
    if (percent >= scale.minPercent) {
      return scale;
    }
  }

  return QAWMI_DHARJA_SCALES[QAWMI_DHARJA_SCALES.length - 1];
}

