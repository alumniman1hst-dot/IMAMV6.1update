
import * as jose from 'jose';

// Configuration for SSO Provider (SSO Imam / Kemenag)
const JWKS_URL = process.env.SSO_JWKS_URL || "https://sso.imam.or.id/.well-known/jwks.json";
const ISSUER = process.env.SSO_ISSUER || "https://sso.imam.or.id";
const AUDIENCE = process.env.SSO_CLIENT_ID || "imam-client-id";

// Cache the JWKS to avoid fetching on every request
let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

export async function getJwksPublicKey() {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

export async function verifyIdToken(idToken: string) {
  try {
    const keyStore = await getJwksPublicKey();
    
    const { payload } = await jose.jwtVerify(idToken, keyStore, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return payload;
  } catch (error) {
    console.error("Token Verification Failed:", error);
    throw new Error("Invalid ID Token");
  }
}
