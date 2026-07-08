export function brandEnvKey(brand) {
  return String(brand).toUpperCase().replace(/-/g, '_');
}

export function resolveBrandSecrets(brand, env) {
  const key = brandEnvKey(brand);
  return {
    token: env[`IG_ACCESS_TOKEN_${key}`] || env.IG_ACCESS_TOKEN,
    userId: env[`IG_USER_ID_${key}`] || env.IG_USER_ID,
  };
}

export function formatCta(cta) {
  if (!cta) return '';
  if (typeof cta === 'string') return cta;
  return [cta.en, cta.ko].filter(Boolean).join('\n');
}
