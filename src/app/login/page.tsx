import { FormularioLogin } from "./formulario";

export const metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">Gestão de demandas</h1>
          <p className="text-sm text-neutral-500">Entre com e-mail e senha, ou crie uma conta.</p>
        </div>

        <FormularioLogin erroInicial={erro} />
      </div>
    </main>
  );
}
