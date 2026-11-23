/**
 * Client-side salted SHA-256 password hashing & verification utility.
 * Supports backwards-compatible verification for legacy plain records while
 * always storing salted SHA-256 digests (`sha256:<salt>:<hex>`) for new/updated passwords.
 */

const HASH_PREFIX = 'sha256:';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeSha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltHex = toHex(saltBytes);
  const hashHex = await computeSha256Hex(`${saltHex}:${plainPassword}`);
  return `${HASH_PREFIX}${saltHex}:${hashHex}`;
}

export async function verifyPassword(plainPassword: string, storedHash?: string): Promise<boolean> {
  if (!storedHash || !plainPassword) return false;

  if (storedHash.startsWith(HASH_PREFIX)) {
    const parts = storedHash.slice(HASH_PREFIX.length).split(':');
    if (parts.length !== 2) return false;
    const [saltHex, expectedHex] = parts;
    if (!saltHex || !expectedHex) return false;
    const computedHex = await computeSha256Hex(`${saltHex}:${plainPassword}`);
    return constantTimeEquals(computedHex, expectedHex);
  }

  return constantTimeEquals(plainPassword, storedHash);
}
