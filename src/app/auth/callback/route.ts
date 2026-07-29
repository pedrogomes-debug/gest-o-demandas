import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Aceita os dois formatos de link:
//   ?code=...                      template padrão do Supabase (fluxo PKCE)
//   ?token_hash=...&type=email     template customizado com {{ .TokenHash }}
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const destino = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
      : { error: { message: "Link inválido ou incompleto." } };

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}
