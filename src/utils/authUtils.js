import jwtDecode from 'jwt-decode';

const DEFAULT_LIMITS = {
  insight: false,
  strategic: false,
  pmf: false,
  can_create_projects: false,
};

/**
 * Reads the plan feature-flags from the signed JWT stored in sessionStorage.
 * Because the JWT is cryptographically signed by the backend, these values
 * cannot be tampered with from the browser – any edit to the payload will
 * invalidate the signature and the backend will reject the token.
 *
 * @returns {{ insight: boolean, strategic: boolean, pmf: boolean, can_create_projects: boolean }}
 */
export function getUserLimits() {
  const token = sessionStorage.getItem('token');
  if (!token) return { ...DEFAULT_LIMITS };
  try {
    const decoded = jwtDecode(token);
    return { ...DEFAULT_LIMITS, ...(decoded.limits ?? {}) };
  } catch {
    return { ...DEFAULT_LIMITS };
  }
}
