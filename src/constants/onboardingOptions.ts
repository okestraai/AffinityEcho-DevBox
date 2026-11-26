// Offered to members everywhere. Earlier answers stay valid on the server.
export const ETHNICITY_OPTIONS = [
  "Black / African",
  "African American",
  "Caribbean",
  "East Asian",
  "South Asian",
  "Southeast Asian",
  "Hispanic / Latino",
  "Indigenous",
  "Middle Eastern / North African",
  "Pacific Islander",
  "White",
  "Mixed",
  "Prefer not to say",
];

export const MAX_ETHNICITIES = 5;

export const LIFE_STAGES = [
  "Entry Level (0-2 years)",
  "Mid-level (3-7 years)",
  "Senior (8-12 years)",
  "Leadership (13+ years)",
  "Executive/C-Suite",
  "Self-employed",
  "Not currently working",
  "Prefer not to say",
];

const THIS_YEAR = new Date().getFullYear();

// This year up to 8 years ahead, matching the server.
export const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => THIS_YEAR + i);
