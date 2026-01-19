// utils/companyFormatter.ts
export const formatCompanyName = (companyName: string): string => {
  if (!companyName || typeof companyName !== 'string') {
    return '';
  }

  // Step 1: Trim and normalize whitespace
  let formatted = companyName.trim().replace(/\s+/g, ' ');
  
  // Step 2: Handle special cases and common company naming patterns
  const specialCases: { [key: string]: string } = {
    'llc': 'LLC',
    'inc': 'Inc',
    'corp': 'Corp',
    'co': 'Co',
    'ltd': 'Ltd',
    'gp': 'GP',
    'lp': 'LP',
    'llp': 'LLP',
    'plc': 'PLC',
    'ag': 'AG',
    'gmbh': 'GmbH',
    'sa': 'SA',
    'nv': 'NV',
    'ab': 'AB'
  };

  // Step 3: Split into words and apply capitalization rules
  const words = formatted.split(' ');
  const formattedWords = words.map((word, index) => {
    const lowerWord = word.toLowerCase();
    
    // Handle special cases (except for first word)
    if (index > 0 && specialCases[lowerWord]) {
      return specialCases[lowerWord];
    }

    // Handle names with apostrophes (O'Reilly, D'Angelo)
    if (word.includes("'")) {
      return word.split("'").map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join("'");
    }

    // Handle names with hyphens (Smith-Jones)
    if (word.includes('-')) {
      return word.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('-');
    }

    // Handle "Mc" and "Mac" prefixes (McDonald, MacDonald)
    if ((lowerWord.startsWith('mc') || lowerWord.startsWith('mac')) && word.length > 2) {
      return word.charAt(0).toUpperCase() + word.charAt(1).toLowerCase() + 
             word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
    }

    // Handle Roman numerals
    const romanNumerals = ['ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    if (romanNumerals.includes(lowerWord)) {
      return word.toUpperCase();
    }

    // Standard capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  formatted = formattedWords.join(' ');

  // Step 4: Common company name corrections
  const commonCorrections: { [key: string]: string } = {
    'Mcdonald': 'McDonald',
    'Macdonald': 'MacDonald',
    'Mcdonalds': 'McDonalds',
    'Jp Morgan': 'JPMorgan',
    'Jp Morgan Chase': 'JPMorgan Chase',
    'Goldman Sachs Group': 'Goldman Sachs',
    'Bmw': 'BMW',
    'Ibm': 'IBM',
    'Hp': 'HP',
    'At&t': 'AT&T',
    'Fbi': 'FBI',
    'Cia': 'CIA',
    'Nasdaq': 'NASDAQ',
    'Nyse': 'NYSE'
  };

  // Apply common corrections
  Object.keys(commonCorrections).forEach(wrong => {
    if (formatted.toLowerCase() === wrong.toLowerCase()) {
      formatted = commonCorrections[wrong];
    }
  });

  return formatted;
};