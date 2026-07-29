"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/demandas", rotulo: "Demandas" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/pessoas", rotulo: "Pessoas" },
];

export function Navegacao() {
  const caminho = usePathname();

  return (
    <nav className="flex gap-1">
      {LINKS.map(({ href, rotulo }) => {
        const ativo = caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              ativo
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
