// Copyright 2026 AdverXarial, byt3n33dl3.
//
// Licensed under the MIT License,
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

let cy=null,gd=null;
const G=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let tT=null;
function toast(m){const e=G('toast');e.textContent=m;e.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('show'),2800)}
function copyTxt(t){navigator.clipboard.writeText(t).then(()=>toast('Copied to clipboard'))}

function initCy(){
  cy=cytoscape({
    container:G('cy'),elements:[],
    style:[
      {
        selector:'node',
        style:{
          'background-image':'data(icon)',
          'background-fit':'contain',
          'background-width':'100%',
          'background-height':'100%',
          'width':50,
          'height':50,
          'label':'data(label)',
          'text-valign':'bottom',
          'text-halign':'center',
          'text-margin-y':8,
          'color':'#888',
          'font-size':11,
          'font-family':'Segoe UI,sans-serif',
          'text-max-width':100,
          'text-wrap':'ellipsis',
        }
      },
      {selector:'node[isRoot="true"]',style:{width:60,height:60}},
      {selector:'node:selected',style:{color:'#e8e8e8'}},
      {selector:'node.hl',style:{color:'#ff4d4d'}},
      {selector:'node.dm',style:{opacity:0.15}},
      {selector:'edge',style:{label:'data(type)','font-size':9,'font-family':'Courier New,monospace',color:'#555','text-rotation':'autorotate','text-margin-y':-8,'curve-style':'bezier','target-arrow-shape':'triangle','target-arrow-color':'#2a2a2a','line-color':'#2a2a2a','arrow-scale':1.3,width:1.8}},
      {selector:'edge[risk="critical"]',style:{'line-color':'#a00000','target-arrow-color':'#a00000',color:'#ff4d4d',width:2.5}},
      {selector:'edge[risk="high"]',style:{'line-color':'#a05000','target-arrow-color':'#a05000',color:'#ff7700',width:2.2}},
      {selector:'edge[risk="medium"]',style:{'line-color':'#6a5000','target-arrow-color':'#6a5000',color:'#f0c040',width:1.8}},
      {selector:'edge[risk="low"]',style:{'line-color':'#0a3e18','target-arrow-color':'#0a3e18',color:'#27ae60'}},
      {selector:'edge.hl',style:{'line-color':'#ff4d4d','target-arrow-color':'#ff4d4d',color:'#ff6666',width:3.2}},
      {selector:'edge.dm',style:{opacity:0.08}},
    ],
    layout:{name:'preset'},wheelSensitivity:0.3,minZoom:0.15,maxZoom:4,
  });
  cy.on('tap','node',e=>nD(e.target));
  cy.on('tap','edge',e=>eD(e.target));
  cy.on('tap',e=>{if(e.target===cy){cD();cy.elements().removeClass('hl dm')}});
  cy.on('mouseover','node',e=>{const n=e.target;cy.elements().addClass('dm');n.removeClass('dm').addClass('hl');n.neighborhood().removeClass('dm').addClass('hl')});
  cy.on('mouseout','node',()=>{if(!cy.$('node:selected').length)cy.elements().removeClass('dm hl')});
}

const ICONS={
  user:'/images/nodes/node-user.png',
  group:'/images/nodes/node-group.png',
  binary:'/images/nodes/node-binary.png',
  service:'/images/nodes/node-service.png',
  cron:'/images/nodes/node-cron.png',
};

function loadJ(data){
  gd=data;cy.elements().remove();
  const els=[];
  data.nodes.forEach(n=>{
    const icon=ICONS[n.type]||ICONS.user;
    els.push({data:{id:n.id,label:n.label||n.id,type:n.type,properties:n.properties||{},isRoot:String(n.properties?.is_root||false),isCurrent:String(n.properties?.is_current||false),icon:icon}});
  });
  data.edges.forEach(e=>els.push({data:{id:e.id,source:e.source,target:e.target,type:e.type,risk:e.risk||'low',properties:e.properties||{}}}));
  cy.add(els);doL();
  G('sn').textContent=data.nodes.length;
  G('se').textContent=data.edges.length;
  G('sp').textContent=data.stats?.paths_to_root||data.edges.filter(e=>e.risk==='critical').length;
  G('sc2').textContent=data.edges.filter(e=>e.risk==='critical').length;
  const e=data.edges;
  G('qc-a').textContent=e.length;
  G('qc-s').textContent=1;
  G('qc-su').textContent=e.filter(x=>x.type?.startsWith('Sudo')).length;
  G('qc-si').textContent=e.filter(x=>x.type==='SuidBinary').length;
  G('qc-d').textContent=e.filter(x=>x.type==='DockerAccess').length;
  G('qc-sv').textContent=e.filter(x=>x.type==='WritableService').length;
  G('qc-cr').textContent=e.filter(x=>x.type==='WritableCron').length;
  G('qc-k').textContent=e.filter(x=>x.type==='KernelExploit').length;
  G('cn-u').textContent=data.nodes.filter(n=>n.type==='user').length;
  G('cn-g').textContent=data.nodes.filter(n=>n.type==='group').length;
  G('cn-b').textContent=data.nodes.filter(n=>n.type==='binary').length;
  G('cn-s').textContent=data.nodes.filter(n=>n.type==='service').length;
  G('cn-c').textContent=data.nodes.filter(n=>n.type==='cron').length;
  const m=data.metadata||{};
  G('mh').textContent=m.hostname||'-';
  G('mo').textContent=m.os||'-';
  G('mk2').textContent=m.kernel||'-';
  G('mu').textContent=m.collected_as||'-';
  G('mb').classList.add('show');
  G('sdot').classList.add('on');
  G('stxt').textContent=m.hostname||'Loaded';
  G('es').style.display='none';
  toast('Loaded · '+data.nodes.length+' nodes · '+data.edges.length+' edges');
}

function doL(){
  if(!cy||!cy.nodes().length)return;
  cy.layout({name:'cose',animate:true,animationDuration:800,randomize:true,nodeRepulsion:14000,idealEdgeLength:160,edgeElasticity:120,gravity:0.5,numIter:1200,fit:true,padding:80}).run();
}

const QT={sudo:['SudoAll','SudoNoPasswd','SudoCommand'],suid:['SuidBinary'],docker:['DockerAccess'],service:['WritableService'],cron:['WritableCron'],kernel:['KernelExploit']};

function rQ(type){
  if(!cy||!cy.nodes().length){toast('No graph loaded');return}
  rQB();
  const btn=G('q-'+type);
  if(btn)btn.classList.add('act');
  cy.elements().removeClass('hl dm');
  if(type==='all')return;
  if(type==='shortest'){hs();return}
  const types=QT[type];
  if(!types)return;
  const m=cy.edges().filter(e=>types.includes(e.data('type')));
  if(!m.length){toast('No results');return}
  cy.elements().addClass('dm');
  m.removeClass('dm').addClass('hl');
  m.connectedNodes().removeClass('dm').addClass('hl');
}

function hs(){
  const root=cy.nodes().filter(n=>n.data('isRoot')==='true').first();
  const cur=cy.nodes().filter(n=>n.data('isCurrent')==='true').first();
  if(!root.length||!cur.length){toast('Cannot find root/current user');return}
  const path=cy.elements().dijkstra({root:cur,directed:true}).pathTo(root);
  if(!path.length){toast('No path found to root');return}
  cy.elements().addClass('dm');
  path.removeClass('dm').addClass('hl');
}

function fT(type){
  if(!cy||!cy.nodes().length)return;
  cy.elements().addClass('dm');
  const n=cy.nodes().filter(n=>n.data('type')===type);
  n.removeClass('dm').addClass('hl');
  n.connectedEdges().removeClass('dm');
  n.connectedNodes().removeClass('dm');
}

function rQB(){document.querySelectorAll('.qb').forEach(b=>b.classList.remove('act'))}
function rv(){rQB();cy&&cy.elements().removeClass('hl dm')}

const NTYPE_IMG={user:'/images/nodes/node-user.png',group:'/images/nodes/node-group.png',binary:'/images/nodes/node-binary.png',service:'/images/nodes/node-service.png',cron:'/images/nodes/node-cron.png'};
const NCO={user:'var(--node-user)',group:'var(--node-group)',binary:'var(--node-binary)',service:'var(--node-service)',cron:'var(--node-cron)'};

function pr(k,v,code=false){return'<div class="dpr"><span class="dpk">'+esc(k)+'</span><span class="dpv'+(code?' code':'')+'">'+esc(String(v))+'</span></div>'}

function nD(node){
  const d=node.data(),p=d.properties||{};
  const img=NTYPE_IMG[d.type]||'/images/nodes/node-default.png';
  let h='<img class="dni" src="'+img+'" alt="'+d.type+'">'+'<div class="dnn">'+esc(d.label)+'</div>'+'<div class="dnt" style="color:'+NCO[d.type]+'">'+d.type+'</div>'+'<div class="dsl"><div class="dslt">Identity</div>'+pr('ID',d.id,true)+(p.uid!==undefined?pr('UID',p.uid):'')+(p.gid!==undefined?pr('GID',p.gid):'')+(p.shell?pr('Shell',p.shell,true):'')+(p.home?pr('Home',p.home,true):'')+(p.path?pr('Path',p.path,true):'')+(p.owner?pr('Owner',p.owner):'')+(p.run_as?pr('Run As',p.run_as):'')+(p.schedule?pr('Schedule',p.schedule,true):'')+(p.state?pr('State',p.state):'')+(p.is_privileged?pr('Privileged','Yes'):'')+'</div>';
  if(p.gtfobin&&p.gtfobin_url)h+='<div class="dsl"><div class="dslt">GTFOBins</div><a class="xl" href="'+p.gtfobin_url+'" target="_blank">View exploit on GTFOBins</a></div>';
  const edges=node.connectedEdges();
  if(edges.length){h+='<div class="dsl"><div class="dslt">Connections ('+edges.length+')</div>';edges.forEach(e=>{const a=e.data('source')===d.id?'to':'from';const o=e.data('source')===d.id?e.target().data('label'):e.source().data('label');h+='<div class="dpr"><span class="dpk">'+a+' '+e.data('type')+'</span><span class="dpv">'+esc(o)+'</span></div>';});h+='</div>';}
  oD(h);
}

function eD(edge){
  const d=edge.data(),p=d.properties||{},r=d.risk||'low';
  let h='<div style="padding:16px 0 10px;text-align:center"><img src="/images/icons/icon-edge-attack.png" alt="edge" style="width:32px;height:32px;object-fit:contain;opacity:.7"></div>'+'<div class="dnn">'+esc(d.type)+'</div>'+'<div style="text-align:center;margin-bottom:16px"><span class="rb r'+r[0]+'">'+r+'</span></div>'+'<div class="dsl"><div class="dslt">Relationship</div>'+pr('Source',edge.source().data('label'))+pr('Target',edge.target().data('label'))+pr('Type',d.type)+pr('Risk',r)+'</div>';
  const skip=['exploit_snippet','gtfobin_url','reference'];
  const props=Object.entries(p).filter(([k])=>!skip.includes(k));
  if(props.length){h+='<div class="dsl"><div class="dslt">Properties</div>';props.forEach(([k,v])=>{h+=pr(k,String(v),['command','entry','cve','desc','kernel','socket'].some(s=>k.includes(s)))});h+='</div>';}
  if(p.exploit_snippet)h+='<div class="dsl"><div class="dslt">Exploit Snippet</div><div class="ebox">'+esc(p.exploit_snippet)+'</div><button class="cpb" onclick="copyTxt('+JSON.stringify(p.exploit_snippet)+')">Copy Snippet</button></div>';
  if(p.gtfobin_url)h+='<div class="dsl"><a class="xl" href="'+p.gtfobin_url+'" target="_blank">View on GTFOBins</a></div>';
  if(p.cve)h+='<div class="dsl"><div class="dslt">CVE Reference</div>'+pr('CVE',p.cve)+(p.description?pr('Description',p.description):'')+(p.reference?'<a class="xl" href="'+p.reference+'" target="_blank">View on NVD</a>':'')+'</div>';
  oD(h);
}

function oD(h){G('db').innerHTML=h;G('dp').classList.add('open')}
function cD(){G('dp').classList.remove('open')}

function clearG(){
  if(!gd)return;
  cy.elements().remove();gd=null;
  G('es').style.display='';
  G('mb').classList.remove('show');
  G('sdot').classList.remove('on');
  G('stxt').textContent='No data loaded';
  ['sp','sn','se','sc2'].forEach(id=>G(id).textContent='0');
  ['qc-a','qc-s','qc-su','qc-si','qc-d','qc-sv','qc-cr','qc-k'].forEach(id=>G(id).textContent='-');
  ['cn-u','cn-g','cn-b','cn-s','cn-c'].forEach(id=>G(id).textContent='-');
  cD();rQB();toast('Graph cleared');
}

function tSS(h){h.classList.toggle('col');h.nextElementSibling.classList.toggle('hidden')}

window.addEventListener('DOMContentLoaded',()=>{
  initCy();
  G('es').style.display='';
  toast('Import your PyPengu JSON to begin');
  G('import-btn').addEventListener('click',()=>G('fi').click());
  G('empty-hint').addEventListener('click',()=>G('fi').click());
  G('clear-btn').addEventListener('click',clearG);
  document.querySelectorAll('.qb[data-query]').forEach(btn=>btn.addEventListener('click',function(){rQ(this.getAttribute('data-query'))}));
  document.querySelectorAll('.qb[data-filter]').forEach(btn=>btn.addEventListener('click',function(){fT(this.getAttribute('data-filter'))}));
  G('reset-btn').addEventListener('click',rv);
  G('zoom-in').addEventListener('click',()=>{if(cy)cy.zoom(cy.zoom()*1.2)});
  G('zoom-out').addEventListener('click',()=>{if(cy)cy.zoom(cy.zoom()*0.8)});
  G('fit-graph').addEventListener('click',()=>{if(cy)cy.fit()});
  G('relayout').addEventListener('click',doL);
  G('dc').addEventListener('click',cD);
  document.querySelectorAll('.ssh').forEach(h=>h.addEventListener('click',function(){tSS(this)}));
  G('si2').addEventListener('input',function(){const q=this.value.trim().toLowerCase();if(!cy)return;if(!q){cy.elements().removeClass('hl dm');return}const m=cy.nodes().filter(n=>{const d=n.data();return d.label.toLowerCase().includes(q)||d.type.toLowerCase().includes(q)||String(d.properties?.uid||'').includes(q)});if(!m.length)return;cy.elements().addClass('dm');m.removeClass('dm').addClass('hl');m.connectedEdges().removeClass('dm');m.connectedNodes().removeClass('dm')});
  G('fi').addEventListener('change',function(){const f=this.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{loadJ(JSON.parse(e.target.result))}catch(err){toast('Invalid JSON: '+err.message)}};r.readAsText(f);this.value=''});
  document.addEventListener('dragover',e=>{e.preventDefault();G('dov').classList.add('active')});
  document.addEventListener('dragleave',e=>{if(!e.relatedTarget)G('dov').classList.remove('active')});
  document.addEventListener('drop',e=>{e.preventDefault();G('dov').classList.remove('active');const f=e.dataTransfer.files[0];if(!f||!f.name.endsWith('.json')){toast('Please drop a .json file');return}const r=new FileReader();r.onload=ev=>{try{loadJ(JSON.parse(ev.target.result))}catch(err){toast('Invalid JSON: '+err.message)}};r.readAsText(f)});
});
