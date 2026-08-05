import fs from "node:fs";
import { parse } from "libpg-query";

const migrationPath = new URL("../supabase/migrations/202608050001_u89_studio_os.sql", import.meta.url);
const sql = fs.readFileSync(migrationPath, "utf8");
await parse(sql);
console.log("Supabase migration SQL parsed successfully");
