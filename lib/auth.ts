/**
 * Helper to interact with Neon Auth service
 */
export async function getNeonAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;

  return {
    configured: Boolean(baseUrl && jwksUrl),
    baseUrl,
    jwksUrl,
  };
}

export async function fetchNeonJwks() {
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!jwksUrl) {
    throw new Error("NEON_AUTH_JWKS_URL is not set");
  }

  const res = await fetch(jwksUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS: ${res.statusText}`);
  }
  return await res.json();
}
