/** Shared password validation rules used across signup, change-password and reset-password. */

export interface PasswordRule {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length',    label: 'At least 8 characters',        test: (pw) => pw.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter',          test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'One lowercase letter',          test: (pw) => /[a-z]/.test(pw) },
  { key: 'number',    label: 'One number',                    test: (pw) => /\d/.test(pw) },
  { key: 'special',   label: 'One special character (!@#$..)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/** Returns the first failing rule's message, or null if all pass. */
export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Password must contain: ${rule.label.toLowerCase()}`;
    }
  }
  return null;
}

/** Returns how many rules pass (0-5). */
export function getPassedRuleCount(password: string): number {
  return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

export interface PasswordStrength {
  label: string;
  color: string;       // tailwind bg class
  textColor: string;   // tailwind text class
  width: string;       // percentage
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { label: '', color: '', textColor: '', width: '0%' };
  const passed = getPassedRuleCount(password);
  if (passed <= 2) return { label: 'Weak',   color: 'bg-red-500',    textColor: 'text-red-600',    width: '33%' };
  if (passed <= 4) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: '66%' };
  return                   { label: 'Strong', color: 'bg-green-500',  textColor: 'text-green-600',  width: '100%' };
}
