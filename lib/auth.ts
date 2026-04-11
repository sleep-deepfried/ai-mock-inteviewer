import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";

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
 * Resolution order:
 * 1. Dev bypass (NEXT_PUBLIC_DEV_BYPASS_AUTH=true)
 * 2. Bearer token from Authorization header (iOS / mobile clients)
 * 3. Supabase server cookies (web browser sessions)
 */
export async function getAuthUser(): Promise<User | null> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return DEV_USER;
  }

  // 1. Check for Bearer token (mobile clients send Authorization: Bearer <jwt>)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization") ?? headerStore.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token) {
      try {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) return user;
      } catch {
        // Token invalid or expired — fall through to cookie auth
      }
    }
  }

  // 2. Fall back to cookie-based auth (web browser)
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
