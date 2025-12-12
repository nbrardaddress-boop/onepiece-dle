// Utils partagés

export function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function norm(s){
  return (s ?? "").toString().trim().toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function hashStr(str){
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export function pickDaily(list, salt){
  const key = todayKey() + "|" + salt;
  const idx = hashStr(key) % list.length;
  return list[idx];
}

export function loadJSON(path){
  return fetch(path, {cache:"no-store"}).then(r=>{
    if(!r.ok) throw new Error(`HTTP ${r.status} en chargeant ${path}`);
    return r.json();
  });
}

export function storageKey(mode){
  return `onepiecedle:${mode}:${todayKey()}`;
}

export function readState(mode){
  try{
    const raw = localStorage.getItem(storageKey(mode));
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}

export function saveState(mode, state){
  localStorage.setItem(storageKey(mode), JSON.stringify(state));
}

export function resetState(mode){
  localStorage.removeItem(storageKey(mode));
}

export function moneyToInt(str){
  // "3 M" / "3 Md" / "300" / "฿ 0"
  const s = (str ?? "").toString().replaceAll("฿","").replaceAll(" ", "").replaceAll(",",".").trim();
  if(!s) return null;
  if(s === "0") return 0;
  const m = s.match(/^([0-9.]+)(Md|M|B)?$/i);
  if(!m) return null;
  const n = parseFloat(m[1]);
  const unit = (m[2]||"").toLowerCase();
  if(unit === "md" || unit === "b") return Math.round(n * 1_000_000_000);
  if(unit === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}

export function sizeToCm(size){
  // "1m88" / "3m50" / "1m99" / "180cm"
  const s = norm(size).replaceAll(" ", "");
  if(!s) return null;
  let m = s.match(/^([0-9]+)m([0-9]+)$/);
  if(m) return parseInt(m[1],10)*100 + parseInt(m[2],10);
  m = s.match(/^([0-9]+)cm$/);
  if(m) return parseInt(m[1],10);
  return null;
}

export function compareText(a,b){
  const na = norm(a), nb = norm(b);
  if(!na || !nb) return {state:"blue", label:"—"};
  if(na === nb) return {state:"green", label:a};
  // partiel (contains)
  if(na.includes(nb) || nb.includes(na)) return {state:"yellow", label:a};
  return {state:"red", label:a};
}

export function compareNumber(guess, target){
  if(guess == null || target == null) return {state:"blue", label:"—"};
  if(guess === target) return {state:"green", label:String(guess)};
  const arrow = guess > target ? "↓" : "↑";
  return {state:"red", label:`${guess} ${arrow}`};
}

export function cellHTML(label, state, small=false){
  const cls = ["cell", small?"small":""].join(" ").trim();
  const dot = `<span class="dot ${state}"></span>`;
  return `<td class="${cls}">${dot} ${escapeHTML(label)}</td>`;
}

export function escapeHTML(s){
  return (s??"").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function uniqueBy(list, keyFn){
  const seen = new Set();
  const out = [];
  for(const x of list){
    const k = keyFn(x);
    if(seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}
