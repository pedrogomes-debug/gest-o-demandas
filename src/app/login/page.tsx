import { redirect } from "next/navigation";

/** Antiga rota de login — redireciona para a home. */
export default function LoginRemovido() {
  redirect("/");
}
