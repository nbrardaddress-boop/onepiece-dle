# Onepiecedle (GitHub Pages)

Ce repo est **100% statique** (HTML/CSS/JS). Tu peux le coller dans GitHub et activer GitHub Pages.

## 1) Mettre en ligne sur GitHub Pages

1. Crée un repo GitHub (ex: `onepiecedle`)
2. Glisse **tout le dossier** dans le repo (ou push via Git)
3. Repo → **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: **main** / folder: **/(root)**
6. Attends le lien du site

## 2) Base de données (200+ persos)

⚠️ L’API `api.api-onepiece.com` a **CORS désactivé**, donc le site ne peut pas l’appeler directement depuis le navigateur.
On génère le JSON **en local**, puis on le commit.

### Option A (simple) : Node
1. Installe Node 18+
2. Dans le dossier du projet:

```bash
npm install
npm run build:data
```

Ça crée:
- `data/characters.raw.json`
- `data/characters.json` (filtré pour éviter les persos trop random)

Ensuite commit/push et c’est bon.

## 3) Ajouter des assets

- Fruits: `assets/fruits/` (fichiers PNG)
- Silhouettes: `assets/silhouettes/` (PNG/JPG)
- Vidéos: `assets/videos/` (MP4)

Et tu mets les liens dans:
- `data/quotes.json`
- `data/silhouettes.json`
- `data/videos.json`

## 4) Mode Classic (indices)
- Saga: débloquée à **5 essais**
- Affiliation: débloquée à **10 essais**

## 5) Admin
Page `admin.html` :
- Check JSON
- Aperçu des persos + filtre
