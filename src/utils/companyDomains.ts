/**
 * Map of supported companies to their known email domains.
 * Used for company verification — only these companies can be verified.
 */
export const COMPANY_DOMAINS: Record<string, string[]> = {
  'Abbott':                  ['abbott.com'],
  'Amazon':                  ['amazon.com', 'amazon.co.uk', 'aboutamazon.com'],
  'Apple':                   ['apple.com'],
  'Bank of America':         ['bankofamerica.com', 'bofa.com', 'bofasecurities.com'],
  'Boston Consulting Group':  ['bcg.com'],
  'Bristol Myers Squibb':    ['bms.com', 'bristolmyers.com'],
  'Deloitte':                ['deloitte.com', 'deloitte.co.uk'],
  'Goldman Sachs':           ['goldmansachs.com', 'gs.com'],
  'Google':                  ['google.com', 'alphabet.com'],
  'Johnson & Johnson':       ['jnj.com'],
  'JPMorgan Chase':          ['jpmorgan.com', 'jpmchase.com', 'chase.com'],
  'McKinsey & Company':      ['mckinsey.com'],
  'Merck':                   ['merck.com', 'msd.com'],
  'Meta':                    ['meta.com', 'facebook.com', 'instagram.com', 'whatsapp.com', 'oculus.com'],
  'Microsoft':               ['microsoft.com', 'linkedin.com', 'github.com'],
  'Netflix':                 ['netflix.com'],
  'Pfizer':                  ['pfizer.com'],
  'PwC':                     ['pwc.com', 'pwcglobal.com'],
  'Tesla':                   ['tesla.com', 'teslamotors.com'],
  'Wells Fargo':             ['wellsfargo.com', 'wf.com'],
  'Memorial University of Newfoundland': ['mun.ca'],
  'Staples Canada':          ['staples.ca'],
};

/** Check if a company name is in our supported verification list */
export function isSupportedCompany(companyName: string): boolean {
  if (!companyName) return false;
  const normalized = companyName.trim();
  return Object.keys(COMPANY_DOMAINS).some(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
}

/** Get the allowed email domains for a company */
export function getDomainsForCompany(companyName: string): string[] {
  if (!companyName) return [];
  const normalized = companyName.trim();
  const entry = Object.entries(COMPANY_DOMAINS).find(
    ([key]) => key.toLowerCase() === normalized.toLowerCase()
  );
  return entry ? entry[1] : [];
}

/** Validate that an email domain matches the company's known domains */
export function validateEmailDomain(email: string, companyName: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const allowedDomains = getDomainsForCompany(companyName);
  return allowedDomains.some((d) => d.toLowerCase() === domain);
}
