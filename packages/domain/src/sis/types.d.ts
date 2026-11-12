export type AdmissionStatus = 'inquiry' | 'applied' | 'exam_scheduled' | 'passed' | 'rejected' | 'enrolled' | 'cancelled';
export interface AdmissionApplication {
    id: string;
    tenantId: string;
    applicationNo: string;
    targetAcademicYearId?: string;
    targetClassId?: string;
    fullNameBn: string;
    fullNameEn: string;
    dateOfBirth?: string;
    gender: 'male' | 'female';
    bloodGroup?: string;
    fatherNameBn?: string;
    motherNameBn?: string;
    guardianPhone: string;
    guardianEmail?: string;
    presentAddress?: string;
    permanentAddress?: string;
    previousMadrasa?: string;
    isResidentialApplicant: boolean;
    isLillahApplicant: boolean;
    writtenExamMarks?: number;
    oralExamMarks?: number;
    interviewRemarks?: string;
    status: AdmissionStatus;
    enrolledStudentId?: string;
    createdAt: string;
}
export interface StudentGuardian {
    id: string;
    tenantId: string;
    studentId: string;
    nameBn: string;
    nameEn: string;
    relationType: string;
    nidNumber?: string;
    occupation?: string;
    phone: string;
    emergencyPhone?: string;
    email?: string;
    address?: string;
    isPrimaryContact: boolean;
    isFinancialSponsor: boolean;
}
export interface HostelRoom {
    id: string;
    tenantId: string;
    branchId?: string;
    buildingName: string;
    floorNumber: string;
    roomNumber: string;
    roomType: string;
    totalBeds: number;
    wardenName?: string;
    wardenPhone?: string;
    isActive: boolean;
}
export interface HostelAllocation {
    id: string;
    tenantId: string;
    studentId: string;
    roomId: string;
    bedNumber: string;
    allocationStart: string;
    allocationEnd?: string;
    isActive: boolean;
    remarks?: string;
}
export interface LillahEvaluation {
    id: string;
    tenantId: string;
    studentId: string;
    evaluatorUserId?: string;
    familyMonthlyIncome: number;
    numberOfSiblings: number;
    isOrphan: boolean;
    fatherOccupation?: string;
    localRecommenderName?: string;
    localRecommenderPhone?: string;
    shariahEligibilityStatus: 'verified_mustahiq' | 'conditional' | 'ineligible';
    subsidyPercentage: number;
    approvedMonthlyStipend: number;
    validUntil?: string;
    notes?: string;
}
