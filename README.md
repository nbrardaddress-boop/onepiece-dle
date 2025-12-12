# OnePieceDLE — version DLE (GitHub Pages)

## But
Deviner un personnage avec des attributs (couleurs + flèches) :
Sexe, Race, Âge, Taille, Fruit, Haki, Prime, Origine, Première apparition, Équipage, Rôle.

## Installation
1) Dézippe
2) Upload le contenu du dossier à la racine du repo :
- index.html
- characters.json
- assets/
- .nojekyll

3) GitHub → Settings → Pages → Deploy from a branch → main / (root)

## Modifier / ajouter des personnages
Édite `characters.json` en gardant les mêmes clés :
id, name, sexe, race, age, taille, fruit, haki, prime, origine, premiere_apparition, equipage, role

Notes :
- age/taille/prime doivent être des nombres.
- haki est une liste (ex: ["Observation","Armement"]).
- fruit : "Aucun" | "Paramecia" | "Zoan" | "Logia"
