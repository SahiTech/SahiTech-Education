import { CurriculumType, LocalizedString } from '../academic/types';

export interface ProgramPolicies {
  residentialQuota?: number;
  lillahFundEnabled?: boolean;
  termSystem?: 'chala' | 'semester';
  minimumAttendancePercent?: number;
  allowOnlineAdmission?: boolean;
  boardReportingEnabled?: boolean;
  customRules?: Record<string, any>;
}

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
  onboardingStep: number;
  isVerified: boolean;
  platformStatus?: 'provisioning' | 'pending_activation' | 'active' | 'suspended' | 'closed';
  sourceApplicationId?: string;
  onboardingCompletedAt?: string;
  boardAffiliation?: string;
  mottoBn?: string;
  mottoEn?: string;
  establishedYear?: number;
  programPolicies?: ProgramPolicies;
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

export type UserRole = 
  | 'madrasa_admin'
  | 'academic_dean'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'hostel_warden';

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  branchId?: string;
  role: UserRole;
  isActive: boolean;
}

