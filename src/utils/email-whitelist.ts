import emailWhitelistCsv from '@/data/email-whitelist.csv?raw';

let whitelistDomains: Set<string> | null = null;

export const getEmailWhitelist = (): Set<string> => {
  if (whitelistDomains) {
    return whitelistDomains;
  }

  // Parse CSV and create a Set of domains
  const domains = emailWhitelistCsv
    .split('\n')
    .slice(1) // Skip header
    .map(line => line.trim())
    .filter(domain => domain.length > 0);

  whitelistDomains = new Set(domains);
  return whitelistDomains;
};

export const isEmailDomainWhitelisted = (email: string): boolean => {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const whitelist = getEmailWhitelist();
  return whitelist.has(domain);
};
