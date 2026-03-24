const DEFAULT_LIMITS = {
  insight: false,
  strategic: false,
  pmf: false,
  project: false,
};

/**
 * Reads the plan feature-flags from the `userLimits` key stored in
 * sessionStorage at login time.  The value is the raw `limits` object
 * from the login API response (e.g. { insight, strategic, pmf, project, … }).
 *
 * @returns {{ insight: boolean, strategic: boolean, pmf: boolean, project: boolean }}
 */
export function getUserLimits() {
  try {
    const raw = sessionStorage.getItem('userLimits');
    if (!raw) return { ...DEFAULT_LIMITS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LIMITS, ...parsed };
  } catch {
    return { ...DEFAULT_LIMITS };
  }
}