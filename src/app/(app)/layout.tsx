import { createClient } from "@/lib/supabase/server";
import { Navegacao } from "./navegacao";
import { sair } from "./actions";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <span className="text-sm font-semibold text-neutral-900">Demandas</span>

          <Navegacao />

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-neutral-500">{user?.email}</span>
            <form action={sair}>
              <button
                type="submit"
                className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
