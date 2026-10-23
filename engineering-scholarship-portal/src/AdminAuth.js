// Storage Key for Admin Auth
export const ADMIN_STORAGE_KEY = "scholar_admin_auth";

// Check if a saved admin session exists and is still valid (2 hours expiry)
export function getSavedAdminAuth() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.expiresAt && parsed.expiresAt > Date.now()) {
      return parsed;
    }
    // Expired or invalid
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  } catch (e) {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  }
}

// Save admin authentication data
export function saveAdminAuth(authData) {
  try {
    // 2 hours expiration from now
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    const toSave = {
      ...authData,
      expiresAt,
    };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(toSave));
    return toSave;
  } catch (e) {
    console.error("Failed to save admin session:", e);
    return authData;
  }
}

// Clear admin session
export function clearAdminAuth() {
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear admin session:", e);
  }
}
