const els = {
  grid: document.getElementById("grid"),
  search: document.getElementById("search"),
  roleFilter: document.getElementById("roleFilter"),
  reload: document.getElementById("reload"),
  status: document.getElementById("status"),
};

let allCharacters = [];

function setStatus(msg, kind = "info") {
  els.status.textContent = msg;
  els.status.style.color = kind === "error" ? "var(--bad)" : (kind === "ok" ? "var(--good)" : "var(--muted)");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function render(list) {
  els.grid.innerHTML = list.map(c => {
    const name = escapeHtml(c.name ?? "Sans nom");
    const role = escapeHtml(c.role ?? "—");
    const age = Number.isFinite(c.age) ? `${c.age} ans` : "Âge ?";
    const desc = escapeHtml(c.description ?? "");
    const tags = Array.isArray(c.tags) ? c.tags : [];

    return `
      <article class="card">
        <h3>${name}</h3>
        <div class="meta">
          <span class="badge">${role}</span>
          <span class="badge">${age}</span>
          <span class="badge">ID: ${escapeHtml(c.id ?? "?")}</span>
        </div>
        <p class="desc">${desc}</p>
        <div class="tags">
          ${tags.slice(0, 10).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");

  setStatus(`${list.length} personnage(s) affiché(s).`, "ok");
}

function buildRoleOptions(chars) {
  const roles = [...new Set(chars.map(c => c.role).filter(Boolean))]
    .sort((a,b)=>String(a).localeCompare(String(b), "fr"));
  els.roleFilter.innerHTML =
    `<option value="">Tous les rôles</option>` +
    roles.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
}

function applyFilters() {
  const q = (els.search.value || "").trim().toLowerCase();
  const role = els.roleFilter.value;

  const filtered = allCharacters.filter(c => {
    const hay = [
      c.name, c.role, c.description,
      ...(Array.isArray(c.tags) ? c.tags : [])
    ].join(" ").toLowerCase();

    const okQ = !q || hay.includes(q);
    const okRole = !role || c.role === role;
    return okQ && okRole;
  });

  render(filtered);
}

async function loadData() {
  const url = `characters.json?v=${Date.now()}`; // cache-bust (Safari friendly)
  setStatus(`Chargement de ${url}…`);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} en chargeant ${res.url}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`JSON invalide : ${e.message}`);
    }

    if (!data || !Array.isArray(data.characters)) {
      throw new Error(`Le JSON doit contenir { "characters": [ ... ] }`);
    }

    allCharacters = data.characters;
    buildRoleOptions(allCharacters);
    applyFilters();
    setStatus(`OK — ${allCharacters.length} personnage(s) chargés.`, "ok");
  } catch (err) {
    console.error(err);
    els.grid.innerHTML = "";
    setStatus(`❌ ${err.message}`, "error");
  }
}

els.search.addEventListener("input", applyFilters);
els.roleFilter.addEventListener("change", applyFilters);
els.reload.addEventListener("click", loadData);

loadData();
