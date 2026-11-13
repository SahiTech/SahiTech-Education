'use server';

export interface ProvisioningResult {
  success: boolean;
  error?: string;
}

/**
 * Direct self-service tenant provisioning is intentionally disabled.
 * New institutions must pass the Global Platform Owner application,
 * verification, invitation, onboarding and final activation lifecycle.
 */
export async function provisionInstitution(): Promise<ProvisioningResult> {
  return {
    success: false,
    error: 'Direct tenant provisioning is disabled. Please submit a Madrasa application for Global Platform Owner review.',
  };
}
