let DB=[],secret=null;
const rows=document.getElementById('rows');
const input=document.getElementById('guessInput');
const btn=document.getElementById('guessBtn');
function dayKey(){const b=new Date('2020-01-01');return Math.floor((Date.now()-b)/86400000)}
function cmp(a,b){return a===b?'ok':'bad'}
function cmpNum(a,b){if(a==null||b==null)return{c:'bad',t:'?'};if(a===b)return{c:'ok',t:a};return{c:'bad',t:a,arr:a<b?'⬆':'⬇'}}
function cmpH(a,b){a=a||[];b=b||[];const c=a.filter(x=>b.includes(x));if(!a.length&&!b.length)return{c:'ok',t:'Aucun'};if(c.length===a.length&&a.length===b.length)return{c:'ok',t:a.join(',')};if(c.length)return{c:'partial',t:a.join(',')};return{c:'bad',t:a.join(',')||'Aucun'}}
function row(g){
  return `<div class="row">
  <div class="cell name"><div class="avatar">${g.image?`<img src="${g.image}">`:''}</div>${g.name}</div>
  <div class="cell ${cmp(g.sexe,secret.sexe)}">${g.sexe||'?'}</div>
  <div class="cell ${cmp(g.race,secret.race)}">${g.race||'?'}</div>
  ${(()=>{const x=cmpNum(g.age,secret.age);return `<div class="cell ${x.c}">${x.t}${x.arr||''}</div>`})()}
  ${(()=>{const x=cmpNum(g.taille,secret.taille);return `<div class="cell ${x.c}">${x.t}${x.arr||''}</div>`})()}
  <div class="cell ${cmp(g.fruit,secret.fruit)}">${g.fruit||'?'}</div>
  ${(()=>{const x=cmpH(g.haki,secret.haki);return `<div class="cell ${x.c}">${x.t}</div>`})()}
  ${(()=>{const x=cmpNum(g.prime,secret.prime);return `<div class="cell ${x.c}">${x.t}${x.arr||''}</div>`})()}
  <div class="cell ${cmp(g.origine,secret.origine)}">${g.origine||'?'}</div>
  <div class="cell ${cmp(g.premiere_apparition,secret.premiere_apparition)}">${g.premiere_apparition||'?'}</div>
  <div class="cell ${cmp(g.equipage,secret.equipage)}">${g.equipage||'?'}</div>
  <div class="cell ${cmp(g.role,secret.role)}">${g.role||'?'}</div>
  </div>`;
}
btn.onclick=()=>{const g=DB.find(p=>p.name.toLowerCase()===input.value.toLowerCase());if(!g)return;rows.insertAdjacentHTML('afterbegin',row(g));input.value=''};
fetch('characters.json').then(r=>r.json()).then(d=>{DB=d.characters;secret=DB[dayKey()%DB.length]});
