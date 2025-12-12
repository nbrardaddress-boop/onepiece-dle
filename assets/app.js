
let DB=[], secret=null;
const rows=document.getElementById("rows");
const input=document.getElementById("guessInput");
const btn=document.getElementById("guessBtn");

function dayIndex(){
  const base=new Date("2020-01-01");
  return Math.floor((Date.now()-base)/86400000);
}

function load(){
  fetch("characters.json")
    .then(r=>r.json())
    .then(d=>{
      DB=d.characters;
      secret=DB[dayIndex()%DB.length];
    });
}

function compareExact(a,b){
  if(!a||!b) return {c:"bad",t:"?"};
  return a===b?{c:"ok",t:a}:{c:"bad",t:a};
}
function compareNum(a,b){
  if(a==null||b==null) return {c:"bad",t:"?"};
  if(a===b) return {c:"ok",t:a};
  return {c:"bad",t:a,arr:a<b?"⬆":"⬇"};
}
function compareHaki(a,b){
  if(!a.length&&!b.length) return {c:"ok",t:"Aucun"};
  const common=a.filter(x=>b.includes(x));
  if(common.length===a.length&&a.length===b.length) return {c:"ok",t:a.join(",")};
  if(common.length) return {c:"partial",t:a.join(",")};
  return {c:"bad",t:a.join(",")||"Aucun"};
}

function guess(name){
  const g=DB.find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(!g) return;
  const r=document.createElement("div");
  r.className="row";

  function cell(cls,txt){return `<div class="cell ${cls}">${txt}</div>`}

  r.innerHTML = `
    <div class="cell name">
      <div class="avatar">${g.image?`<img src="${g.image}">`:""}</div>
      ${g.name}
    </div>
    ${(()=>{const x=compareExact(g.sexe,secret.sexe);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.race,secret.race);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareNum(g.age,secret.age);return cell(x.c,x.t+(x.arr||""))})()}
    ${(()=>{const x=compareNum(g.taille,secret.taille);return cell(x.c,x.t+(x.arr||""))})()}
    ${(()=>{const x=compareExact(g.fruit,secret.fruit);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareHaki(g.haki||[],secret.haki||[]);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareNum(g.prime,secret.prime);return cell(x.c,x.t+(x.arr||""))})()}
    ${(()=>{const x=compareExact(g.origine,secret.origine);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.premiere_apparition,secret.premiere_apparition);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.equipage,secret.equipage);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.role,secret.role);return cell(x.c,x.t)})()}
  `;
  rows.prepend(r);
}

btn.onclick=()=>{
  guess(input.value);
  input.value="";
};

load();
