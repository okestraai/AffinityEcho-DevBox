import { Check, X } from 'lucide-react';
import { PASSWORD_RULES, getPasswordStrength } from '../../utils/passwordUtils';

interface Props {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: Props) {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Password strength:</span>
        <span className={`text-xs font-semibold ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${strength.color} h-2 rounded-full transition-all duration-300`}
          style={{ width: strength.width }}
        />
      </div>

      {/* Rule checklist */}
      <div className="grid grid-cols-2 gap-1 mt-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <div key={rule.key} className="flex items-center gap-1">
              {passed ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${passed ? 'text-green-600' : 'text-gray-500'}`}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
