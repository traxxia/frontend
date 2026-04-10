import { useAuthStore } from '../store/authStore';

const DEFAULT_LIMITS = {
  insight: false,
  strategic: false,
  pmf: false,
  project: false,
};

/**
 * Reads the plan feature-flags from the `userLimits` in useAuthStore.
 *
 * @returns {{ insight: boolean, strategic: boolean, pmf: boolean, project: boolean }}
 */
export function getUserLimits() {
  try {
    const limits = useAuthStore.getState().userLimits;
    if (!limits) return { ...DEFAULT_LIMITS };
    return { ...DEFAULT_LIMITS, ...limits };
  } catch {
    return { ...DEFAULT_LIMITS };
  }
}