'use client';

import { useFormStatus } from 'react-dom';
import { LogOut } from 'lucide-react';
import { signOutUser } from '@/app/actions/auth';

interface WorkspaceLogoutButtonProps {
  label: string;
  className?: string;
  formClassName?: string;
}

function SubmitButton({ label, className }: Pick<WorkspaceLogoutButtonProps, 'label' | 'className'>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      aria-busy={pending}
      className={className}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{pending ? 'Signing out…' : label}</span>
    </button>
  );
}

/**
 * Shared sign-out control for authenticated institution workspaces.
 * Global Platform Owner routes use their separate restricted shell and do not render this component.
 */
export function WorkspaceLogoutButton({
  label,
  className,
  formClassName,
}: WorkspaceLogoutButtonProps) {
  return (
    <form action={signOutUser} className={formClassName}>
      <SubmitButton label={label} className={className} />
    </form>
  );
}
