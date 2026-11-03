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
 // A single late-game Hog Rider upgrade must use its normal source cost/time.
 ctx.testCat=JSON.parse(fs.readFileSync(path.join(root,'data/dark.json')));
 ctx.testUnit=ctx.testCat.units.find(u=>u.n==='Hog Rider');
 vm.runInContext("S.th=18; S.tab='max'; S.cur['dark|Hog Rider']='14'; unitView(testCat,testUnit)",ctx);
 assert(html().includes('340,000'), 'Hog Rider level 15 normal cost');
 assert(html().includes('14d 12h'), 'Hog Rider level 15 normal time');
 assert.equal(manifest.groups.flatMap(g=>g.cats).filter(c=>c.data).length,2);
 console.log(`Preview access controls and all four tabs passed for ${count} entities; only two categories published.`);
})().catch(e=>{console.error(e);process.exit(1);});
