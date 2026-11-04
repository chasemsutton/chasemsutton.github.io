const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..', 'clash');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/categories.json')));
function context(search) {
  const elements = new Map();
  const make = () => ({innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},classList:{contains:()=>false,toggle:()=>false},querySelectorAll:()=>[],setAttribute(){},insertAdjacentHTML(){},focus(){},setSelectionRange(){}});
  const document = {querySelector(s) {if(!elements.has(s)) elements.set(s,make());return elements.get(s);}};
  const ctx = vm.createContext({document,location:{search,hash:'#/'},localStorage:{getItem:()=>null,setItem(){}},URLSearchParams,console,window:{addEventListener(){},scrollTo(){}},fetch:async p=>({ok:fs.existsSync(path.join(root,p)),json:async()=>JSON.parse(fs.readFileSync(path.join(root,p)))})});
  vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/render\(\);\s*$/, ''),ctx);
  vm.runInContext('CATS = '+JSON.stringify(manifest),ctx);
  return {ctx,html:()=>document.querySelector('#app').innerHTML};
}
(async()=>{
 for (const preview of ['', '?preview=dark', '?preview=all', '?preview=unknown']) {
  const {ctx,html}=context(preview);
  vm.runInContext('home()',ctx);
  for(const c of manifest.groups.flatMap(g=>g.cats)){
   const enabled=!!c.data || preview==='?preview=all' || preview===`?preview=${c.id}`;
   assert.equal(html().includes(`href="#/c/${c.id}"`),enabled,`${preview} / ${c.id}`);
   const loaded=await vm.runInContext(`loadCat(${JSON.stringify(c.id)})`,ctx);
   assert.equal(!!loaded,enabled,`route guard: ${preview} / ${c.id}`);
  }
 }
 const {ctx,html}=context('?preview=all');
 let count=0;
 for(const file of fs.readdirSync(path.join(root,'data')).filter(f=>f.endsWith('.json')&&f!=='categories.json')) {
  const cat=JSON.parse(fs.readFileSync(path.join(root,'data',file)));
  ctx.testCat=cat;
  vm.runInContext('catView(testCat)',ctx);
  assert(!html().includes('undefined'),file);
  for(const unit of cat.units){
   ctx.testUnit=unit;
   for(const tab of ['info','stats','images','max']){
    vm.runInContext(`S.tab='${tab}'; unitView(testCat,testUnit)`,ctx);
    assert(!html().includes('NaN'),`${file} ${unit.n} ${tab}`);
   }
   count++;
  }
 }
 const equipment = JSON.parse(fs.readFileSync(path.join(root,'data/equip.json')));
 assert.equal(equipment.units.length,43);
 for (const u of equipment.units) {
   const rows = u.tables.find(t=>t.columns[0]==='Level').rows;
   assert.deepEqual(Object.keys(u.hallByLevel),rows.map(r=>r[0]),u.n+' complete caps');
   assert(u.revision > 0 && u.verification.rawWikitextSHA256.length===64,u.n+' source evidence');
 }
 const cap = (name,th) => Math.max(0,...Object.entries(equipment.units.find(u=>u.n===name).hallByLevel).filter(([,h])=>h<=th).map(([l])=>+l));
 for(const [name,th,expected] of [
   ['Barbarian Puppet',4,1],['Barbarian Puppet',7,1],['Barbarian Puppet',8,9],
   ['Barbarian Puppet',10,12],['Barbarian Puppet',12,15],['Barbarian Puppet',14,18],
   ['Vampstache',9,0],['Vampstache',10,12],['Eternal Tome',10,0],['Eternal Tome',11,12],
   ['Royal Gem',12,0],['Royal Gem',13,15],['Rocket Spear',12,0],['Rocket Spear',13,18],
   ['Rocket Spear',14,21],['Rocket Spear',15,24],['Rocket Spear',16,27],
   ['Fire Heart',14,0],['Fire Heart',15,18],['Stun Blaster',15,0],['Stun Blaster',16,18],
   ['Electro Fangs',16,0],['Electro Fangs',17,18]
 ]) assert.equal(cap(name,th),expected,`${name} TH${th}`);
 for(const [level,max,gold] of [[9,18,false],[18,18,true],[24,27,false],[27,27,true],[0,0,false]])
   assert.equal(vm.runInContext(`levelPill(${level},${max},'Locked')`,ctx).includes('full-max'),gold);
 ctx.testCat=equipment;
 vm.runInContext('S.th=18; catView(testCat)',ctx);
 assert(!html().includes('Hall cap unverified'));
 ctx.testUnit=equipment.units.find(u=>u.n==='Barbarian Puppet');
 vm.runInContext("S.th=4; S.tab='stats'; unitView(testCat,testUnit)",ctx);
 assert(html().includes('154.5'),'TH4 reduced Barbarian Puppet HP');
 ctx.testUnit=equipment.units.find(u=>u.n==='Fireball');
 vm.runInContext("S.th=18; S.tab='max'; S.cur['equip|Fireball']='1'; unitView(testCat,testUnit)",ctx);
 for(const value of ['56,060','3,720','480','Instant']) assert(html().includes(value),value);
 // A single late-game Hog Rider upgrade must use its normal source cost/time.
 ctx.testCat=JSON.parse(fs.readFileSync(path.join(root,'data/dark.json')));
 ctx.testUnit=ctx.testCat.units.find(u=>u.n==='Hog Rider');
 vm.runInContext("S.th=18; S.tab='max'; S.cur['dark|Hog Rider']='14'; unitView(testCat,testUnit)",ctx);
 assert(html().includes('340,000'), 'Hog Rider level 15 normal cost');
 assert(html().includes('14d 12h'), 'Hog Rider level 15 normal time');
 assert.equal(manifest.groups.flatMap(g=>g.cats).filter(c=>c.data).length,2);
 console.log(`Preview access controls and all four tabs passed for ${count} entities; only two categories published.`);
})().catch(e=>{console.error(e);process.exit(1);});
