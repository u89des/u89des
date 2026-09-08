import fs from "node:fs";
import { parse } from "libpg-query";

const directory = new URL("../supabase/migrations/", import.meta.url);
for (const name of fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
  await parse(fs.readFileSync(new URL(name, directory), "utf8"));
}
console.log("Supabase migration SQL parsed successfully");
