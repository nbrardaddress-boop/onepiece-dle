// Télécharge les persos depuis l'API api.api-onepiece.com (EN) et les stocke en raw.
//
// Usage: node scripts/fetch_api_onepiece.mjs
import fs from "node:fs/promises";

const URL = "https://api.api-onepiece.com/v2/characters/en";

const res = await fetch(URL);
if(!res.ok) throw new Error(`HTTP ${res.status} sur ${URL}`);
const data = await res.json();

await fs.mkdir("./data", {recursive:true});
await fs.writeFile("./data/characters.raw.json", JSON.stringify(data, null, 2), "utf8");

console.log(`OK: ${data.length} persos -> data/characters.raw.json`);
