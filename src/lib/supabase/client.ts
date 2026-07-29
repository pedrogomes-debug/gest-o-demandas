import { createSupabase } from "./env";

export function createClient() {
  return createSupabase();
}
