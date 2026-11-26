import { Building, Globe, GraduationCap } from "lucide-react";

export type Audience = "everyone" | "company" | "students";

interface Props {
  value: Audience;
  onChange: (audience: Audience) => void;
  isStudent: boolean;
  // The member's company space, or empty when they have none.
  companyLabel: string;
  disabled?: boolean;
  legend?: string;
}

// Who sees a topic, Nook or post. Students only appears for students.
export function AudiencePicker({
  value,
  onChange,
  isStudent,
  companyLabel,
  disabled,
  legend = "Who can see it",
}: Props) {
  const options = [
    { key: "everyone" as const, label: "Everyone", note: "All members", icon: <Globe className="w-4 h-4" />, enabled: true },
    {
      key: "company" as const,
      label: "My company",
      note: companyLabel || "Add your company in Edit Profile",
      icon: <Building className="w-4 h-4" />,
      enabled: !!companyLabel,
    },
    ...(isStudent
      ? [{ key: "students" as const, label: "Students", note: "Only students", icon: <GraduationCap className="w-4 h-4" />, enabled: true }]
      : []),
  ];

  return (
    <fieldset disabled={disabled}>
      <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
      <div className={`grid grid-cols-1 gap-3 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            disabled={!o.enabled}
            onClick={() => onChange(o.key)}
            className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
              value === o.key
                ? "bg-purple-50 border-purple-300 text-purple-800"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="flex items-center gap-2 font-medium">
              {o.icon}
              {o.label}
            </span>
            <span className="block text-xs mt-1">{o.note}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
