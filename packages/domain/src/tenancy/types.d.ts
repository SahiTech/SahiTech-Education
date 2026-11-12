import { CurriculumType } from '../academic/types';
export interface Tenant {
    id: string;
    name: string;
    code: string;
    subdomain?: string;
    customDomain?: string;
    curriculumType: CurriculumType;
    registrationNo?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    district?: string;
    division?: string;
    logoUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Branch {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    isMainBranch: boolean;
    address?: string;
    phone?: string;
}
export type UserRole = 'super_admin' | 'madrasa_admin' | 'academic_dean' | 'teacher' | 'student' | 'parent' | 'accountant' | 'hostel_warden';
export interface TenantUser {
    id: string;
    tenantId: string;
    userId: string;
    branchId?: string;
    role: UserRole;
    isActive: boolean;
}
