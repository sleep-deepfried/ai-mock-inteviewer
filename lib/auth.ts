import type { User } from "@supabase/supabase-js";

/** Synthetic dev user returned when auth bypass is enabled. */
const DEV_USER: User = {
  id: "dev-user-00000000-0000-0000-0000-000000000000",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@localhost",
  app_metadata: {},
  user_metadata: { full_name: "Dev User" },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
};

/**
 * Get the authenticated user from the request.
 *
 * When `NEXT_PUBLIC_DEV_BYPASS_AUTH` is `"true"`, returns a synthetic dev user
 * without contacting Supabase. Otherwise delegates to the Supabase server client.
 */
export async function getAuthUser(): Promise<User | null> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return DEV_USER;
  }

  // Dynamic import to avoid pulling in cookie-dependent code at module level
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
