import { createSupabase } from "./env";

export async function createClient() {
  return createSupabase();
}
