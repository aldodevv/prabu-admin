/**
 * Cookie utility functions for reliable cookie management.
 *
 * Solves the desync issue between localStorage and cookies where
 * JWT tokens stored via raw `document.cookie` could fail silently
 * due to encoding issues or size limits.
 */

const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Set a cookie with proper encoding and error handling.
 * Uses encodeURIComponent to safely handle JWT tokens containing
 * special characters (dots, base64 chars, etc.)
 */
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): boolean {
  try {
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;

    // Verify the cookie was actually set
    return verifyCookie(name, value);
  } catch (err) {
    console.error(`[cookieUtils] Failed to set cookie "${name}":`, err);
    return false;
  }
}

/**
 * Get a cookie value by name, with proper decoding.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName === name) {
        const rawValue = cookieValueParts.join('=');
        return rawValue ? decodeURIComponent(rawValue) : null;
      }
    }
    return null;
  } catch (err) {
    console.error(`[cookieUtils] Failed to get cookie "${name}":`, err);
    return null;
  }
}

/**
 * Delete a cookie by name.
 */
export function deleteCookie(name: string): void {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch (err) {
    console.error(`[cookieUtils] Failed to delete cookie "${name}":`, err);
  }
}

/**
 * Verify a cookie was correctly stored by reading it back.
 * Returns true if the cookie value matches the expected value.
 */
function verifyCookie(name: string, expectedValue: string): boolean {
  const stored = getCookie(name);
  return stored === expectedValue;
}

/**
 * Ensures a cookie is set and returns a promise that resolves
 * once verified. Retries up to maxRetries times with a small delay.
 *
 * Use this before navigation to guarantee the cookie is available
 * for Next.js middleware on the next request.
 */
export async function ensureCookieSet(
  name: string,
  value: string,
  maxAge: number = COOKIE_MAX_AGE,
  maxRetries: number = 3,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (setCookie(name, value, maxAge)) {
      return true;
    }
    // Small delay before retry to let browser flush
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.warn(`[cookieUtils] Cookie "${name}" failed to set after ${maxRetries} retries`);
  return false;
}
