// Transforme characters.raw.json -> characters.json (schéma du site).
// Et applique un filtre "qualité" pour éviter les persos ultra-obscurs.
//
// Usage: node scripts/build_characters.mjs
import fs from "node:fs/promises";

const raw = JSON.parse(await fs.readFile("./data/characters.raw.json","utf8"));

// Heuristique simple: on garde si
// - bounty renseignée (pas vide) OU
// - crew renseigné OU
// - fruit renseigné OU
// - name dans whitelist
const whitelist = new Set([
  "gaimon","higuma","makino","woop slap","woopslap","woopslap"
]);

function norm(s){
  return (s??"").toString().trim().toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu,"");
}

function keep(c){
  const name = norm(c.name);
  const hasBounty = (c.bounty??"").toString().trim() !== "" && (c.bounty??"").toString().trim() !== "0";
  const hasCrew = !!c.crew?.name;
  const hasFruit = !!c.fruit?.name;
  return hasBounty || hasCrew || hasFruit || whitelist.has(name);
}

const filtered = raw.filter(keep);

// mapping -> le site utilise un champ meta (que tu complètes petit à petit)
const mapped = filtered.map(c=>({
  id: c.id,
  name: c.name,
  job: c.job ?? "",
  size: c.size ?? "",
  birthday: c.birthday ?? "",
  age: c.age ?? "",
  bounty: c.bounty ?? "",
  status: c.status ?? "",
  crew: c.crew ? { id:c.crew.id, name:c.crew.name } : null,
  fruit: c.fruit ? {
    id:c.fruit.id,
    name:c.fruit.name,
    type:c.fruit.type,
    filename: c.fruit.filename || ""
  } : null,
  meta: {
    gender: "",
    race: "",
    origin: "",
    firstSaga: "",
    firstArc: "",
    haki: [],
    role: c.job ?? "",
    affiliation: c.crew?.name ?? ""
  }
}));

await fs.writeFile("./data/characters.json", JSON.stringify(mapped, null, 2), "utf8");
console.log(`OK: ${mapped.length} persos -> data/characters.json`);
