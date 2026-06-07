import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// OAuth callback. Supabase redirects here with a `code` after Google sign-in.
// We exchange it for a session (stored in cookies) then redirect to the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // On error or missing code, send the user back to the login screen.
  return NextResponse.redirect(`${origin}/?auth_error=1`)
}
