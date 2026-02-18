import { getArtists } from "@festibee/api/generated";

/**
 * Verify admin password by making a test API call.
 * If the password (X-Admin-Password header) is correct, the call succeeds.
 * If wrong, it throws an error.
 */
export async function verifyAdminPassword(): Promise<boolean> {
  await getArtists();
  return true;
}
