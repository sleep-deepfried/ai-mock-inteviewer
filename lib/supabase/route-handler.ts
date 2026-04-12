import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for Route Handlers: uses the caller's JWT so RLS matches the signed-in user.
 *
 * - **Bearer token** (iOS / native): forwards `Authorization` on every request — required for inserts
 *   under RLS (`auth.jwt()->>'email'`, etc.).
 * - **No Bearer** (browser): falls back to cookie-based `@/lib/supabase/server` session.
 */
export async function createSupabaseForRouteHandler(
  request: Request,
): Promise<SupabaseClient> {
  const authHeader =
    request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (
    authHeader?.startsWith("Bearer ") &&
    authHeader.slice("Bearer ".length).trim().length > 0
  ) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );
  }

  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}
