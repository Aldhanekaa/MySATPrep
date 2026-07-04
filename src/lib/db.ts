/**
 * @deprecated Import from "@/lib/db/index" or "@/lib/db" directly.
 *
 * This file is kept as a re-export shim so that existing imports of
 * `config`, `REVALIDATE_LONG`, and `REVALIDATE_MEDIUM` from "@/lib/db"
 * continue to resolve without touching every consumer route.
 */
export {
  config,
  REVALIDATE_LONG,
  REVALIDATE_MEDIUM,
  sql,
  db,
} from "@/lib/db/index";

export { pool } from "@/lib/auth";
