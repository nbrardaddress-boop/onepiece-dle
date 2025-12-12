const els = {
  grid: document.getElementById("grid"),
  search: document.getElementById("search"),
  roleFilter: document.getElementById("roleFilter"),
  reload: document.getElementById("reload"),
  status: document.getElementById("status"),
  details: document.getElementById("details"),
  clear: document.getElementById("clear"),
};

let allCharacters = [];
let selectedId = null;

function setStatus(msg, kind = "info") {
  els.status.textContent = msg;
  els.status.style.color =
    kind === "error" ? "var(--bad)" :
    kind === "ok" ? "var(--good)" :
    "var(--muted)";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function buildRoleOptions(chars) {
  const roles = [...new Set(chars.map(c => c.role).filter(Boolean))]
    .sort((a,b)=>String(a).localeCompare(String(b), "fr"));
  els.roleFilter.innerHTML =
    `<option value="">Tous les rôles</option>` +
    roles.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
}

function currentList() {
  const q = (els.search.value || "").trim().toLowerCase();
  const role = els.roleFilter.value;

  return allCharacters.filter(c => {
    const hay = [
      c.name, c.role, c.description,
      ...(Array.isArray(c.tags) ? c.tags : [])
    ].join(" ").toLowerCase();

    const okQ = !q || hay.includes(q);
    const okRole = !role || c.role === role;
    return okQ && okRole;
  });
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `<div class="row">${tags.slice(0, 14).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`;
}

function renderDetails(c) {
  if (!c) {
    els.details.classList.add("empty");
    els.details.innerHTML = `<p>Cliques un personnage pour voir sa fiche 👈</p>`;
    return;
  }

  els.details.classList.remove("empty");
  els.details.innerHTML = `
    <h3 class="name">${escapeHtml(c.name ?? "Sans nom")}</h3>
    <p class="small">ID: ${escapeHtml(c.id ?? "?")}</p>
    <div class="row">
      <span class="badge">${escapeHtml(c.role ?? "—")}</span>
      <span class="badge">${Number.isFinite(c.age) ? `${c.age} ans` : "Âge ?"}</span>
    </div>
    ${renderTags(c.tags)}
    <p class="p">${escapeHtml(c.description ?? "")}</p>
  `;
}

function renderGrid(list) {
  els.grid.innerHTML = list.map(c => {
    const selected = (c.id === selectedId) ? "selected" : "";
    const tags = Array.isArray(c.tags) ? c.tags : [];
    return `
      <article class="card ${selected}" data-id="${escapeHtml(c.id)}" tabindex="0" role="button" aria-pressed="${c.id === selectedId}">
        <h3>${escapeHtml(c.name ?? "Sans nom")}</h3>
        <div class="meta">
          <span class="badge">${escapeHtml(c.role ?? "—")}</span>
          <span class="badge">${Number.isFinite(c.age) ? `${c.age} ans` : "Âge ?"}</span>
          <span class="badge">ID: ${escapeHtml(c.id ?? "?")}</span>
        </div>
        <p class="desc">${escapeHtml(c.description ?? "")}</p>
        <div class="tags">
          ${tags.slice(0, 10).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");

  // clic + clavier
  document.querySelectorAll(".card").forEach(card => {
    const activate = () => {
      const id = Number(card.dataset.id);
      selectedId = (selectedId === id) ? null : id;
      const listNow = currentList();
      renderGrid(listNow);
      renderDetails(allCharacters.find(x => x.id === selectedId) || null);
      setStatus(`${listNow.length} personnage(s) affiché(s).`, "ok");
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });
}

function refreshUI() {
  const list = currentList();

  // si le perso sélectionné n'est plus dans le filtre, on le garde en fiche si présent dans allCharacters,
  // mais on peut aussi le clear. Ici: on clear pour éviter la confusion.
  if (selectedId !== null && !list.some(c => c.id === selectedId)) {
    selectedId = null;
    renderDetails(null);
  } else {
    renderDetails(allCharacters.find(x => x.id === selectedId) || null);
  }

  renderGrid(list);
  setStatus(`${list.length} personnage(s) affiché(s).`, "ok");
}

async function loadData() {
  const url = `characters.json?v=${Date.now()}`; // cache-bust Safari/Firefox
  setStatus(`Chargement de ${url}…`);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} en chargeant ${res.url}`);

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { throw new Error(`JSON invalide : ${e.message}`); }

    if (!data || !Array.isArray(data.characters)) {
      throw new Error(`Le JSON doit contenir { "characters": [ ... ] }`);
    }

    // Normalisation légère
    allCharacters = data.characters.map(c => ({
      id: Number(c.id),
      name: c.name ?? "",
      age: Number.isFinite(c.age) ? c.age : (c.age !== undefined ? Number(c.age) : undefined),
      role: c.role ?? "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      description: c.description ?? ""
    })).filter(c => Number.isFinite(c.id));

    // reset sélection si l'id n'existe plus
    if (selectedId !== null && !allCharacters.some(c => c.id === selectedId)) {
      selectedId = null;
      renderDetails(null);
    }

    buildRoleOptions(allCharacters);
    refreshUI();
    setStatus(`OK — ${allCharacters.length} personnage(s) chargés.`, "ok");
  } catch (err) {
    console.error(err);
    els.grid.innerHTML = "";
    renderDetails(null);
    setStatus(`❌ ${err.message}`, "error");
  }
}

els.search.addEventListener("input", refreshUI);
els.roleFilter.addEventListener("change", refreshUI);
els.reload.addEventListener("click", loadData);
els.clear.addEventListener("click", () => { selectedId = null; refreshUI(); });

loadData();
