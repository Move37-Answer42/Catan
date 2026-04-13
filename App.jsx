import React, { useState, useEffect, useRef } from "react";

const S=60, Q3=Math.sqrt(3);
const COORDS=[{q:0,r:-2},{q:1,r:-2},{q:2,r:-2},{q:-1,r:-1},{q:0,r:-1},{q:1,r:-1},{q:2,r:-1},{q:-2,r:0},{q:-1,r:0},{q:0,r:0},{q:1,r:0},{q:2,r:0},{q:-2,r:1},{q:-1,r:1},{q:0,r:1},{q:1,r:1},{q:-2,r:2},{q:-1,r:2},{q:0,r:2}];
const TILES={forest:{bg:'#243f1a',hi:'#3a6828',em:'🌲',lb:'LUMBER'},pasture:{bg:'#3d7a2c',hi:'#5db044',em:'🐑',lb:'WOOL'},fields:{bg:'#a06c10',hi:'#d49020',em:'🌾',lb:'GRAIN'},hills:{bg:'#8c2a14',hi:'#be3c1e',em:'🧱',lb:'BRICK'},mountains:{bg:'#484848',hi:'#6e6e6e',em:'⛰',lb:'ORE'},desert:{bg:'#8c7c2e',hi:'#b8a03c',em:'☀',lb:''}};
const PORT_TYPES=[{res:'lumber',rt:'2:1',bg:'#243f1a',sym:'🌲'},{res:'wool',rt:'2:1',bg:'#3d7a2c',sym:'🐑'},{res:'grain',rt:'2:1',bg:'#a06c10',sym:'🌾'},{res:'brick',rt:'2:1',bg:'#8c2a14',sym:'🧱'},{res:'ore',rt:'2:1',bg:'#484848',sym:'⛰'},{res:'any',rt:'3:1',bg:'#5a3e1c',sym:'⚓'},{res:'any',rt:'3:1',bg:'#5a3e1c',sym:'⚓'},{res:'any',rt:'3:1',bg:'#5a3e1c',sym:'⚓'},{res:'any',rt:'3:1',bg:'#5a3e1c',sym:'⚓'}];
const PORT_SLOTS=[{q:0,r:-2,ang:270},{q:2,r:-2,ang:330},{q:2,r:-1,ang:0},{q:2,r:0,ang:60},{q:0,r:2,ang:90},{q:-1,r:2,ang:120},{q:-2,r:2,ang:150},{q:-2,r:1,ang:180},{q:-1,r:-1,ang:240}];
const NUMS=[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];
const PIPS={2:1,3:2,4:3,5:4,6:5,8:5,9:4,10:3,11:2,12:1};
const RF={forest:'lumber',pasture:'wool',fields:'grain',hills:'brick',mountains:'ore',desert:null};
const RE={lumber:'🌲',wool:'🐑',grain:'🌾',brick:'🧱',ore:'⛰'};
const RES=['lumber','wool','grain','brick','ore'];
const COST={road:{lumber:1,brick:1},settlement:{lumber:1,brick:1,wool:1,grain:1}};
const EMPTY=()=>({lumber:0,wool:0,grain:0,brick:0,ore:0});
const PLAYERS=[{id:0,name:'You',color:'#4c9be8',type:'human'},{id:1,name:'The Settler',color:'#e85c5c',type:'settler'},{id:2,name:'The Farmer',color:'#4ec46e',type:'farmer'}];
const SO=[0,1,2,2,1,0];

// ── Helpers ──────────────────────────────────────────────────────────────────
const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const hxy=(q,r)=>({x:S*Q3*(q+r/2),y:S*1.5*r});
const hp=(cx,cy,r)=>Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');

const buildGraph=hexes=>{
  const vm={},vs=[],es=[],es2=new Set();
  hexes.forEach(hex=>{
    const{x:hx,y:hy}=hxy(hex.q,hex.r);const lids=[];
    for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30),vx=Math.round(hx+S*Math.cos(a)),vy=Math.round(hy+S*Math.sin(a)),k=`${vx}_${vy}`;if(!vm[k]){vm[k]={id:vs.length,x:vx,y:vy,hexes:[],owner:null};vs.push(vm[k]);}if(!vm[k].hexes.find(h=>h.q===hex.q&&h.r===hex.r))vm[k].hexes.push(hex);lids.push(vm[k].id);}
    for(let i=0;i<6;i++){const[a,b]=[lids[i],lids[(i+1)%6]],ek=a<b?`${a}_${b}`:`${b}_${a}`;if(!es2.has(ek)){es2.add(ek);es.push({id:es.length,v1:a,v2:b,owner:null});}}
  });
  return{vertices:vs,edges:es};
};

const mkBoard=()=>{
  const tiles=shuf([...Array(4).fill('forest'),...Array(4).fill('pasture'),...Array(4).fill('fields'),...Array(3).fill('hills'),...Array(3).fill('mountains'),'desert']);
  const hexes=COORDS.map((c,i)=>({...c,res:tiles[i],num:null}));
  const nd=hexes.filter(h=>h.res!=='desert');
  for(let t=0;t<5000;t++){const nums=shuf([...NUMS]),m={};nd.forEach((h,i)=>{m[`${h.q},${h.r}`]=nums[i];});if(nd.every((h,i)=>{if(nums[i]!==6&&nums[i]!==8)return true;return![[h.q+1,h.r],[h.q-1,h.r],[h.q,h.r+1],[h.q,h.r-1],[h.q+1,h.r-1],[h.q-1,h.r+1]].some(([a,b])=>{const v=m[`${a},${b}`];return v===6||v===8;});})){nd.forEach((h,i)=>{hexes.find(x=>x.q===h.q&&x.r===h.r).num=nums[i];});break;}}
  const pt=shuf([...PORT_TYPES]),{vertices,edges}=buildGraph(hexes),ds=hexes.find(h=>h.res==='desert');
  return{hexes,ports:PORT_SLOTS.map((sl,i)=>({q:sl.q,r:sl.r,ang:sl.ang,...pt[i]})),vertices,edges,robber:{q:ds.q,r:ds.r}};
};

// ── Placement rules ───────────────────────────────────────────────────────────
const vsv=(vs,es)=>vs.filter(v=>{if(v.owner!==null)return false;const adj=es.filter(e=>e.v1===v.id||e.v2===v.id).map(e=>e.v1===v.id?e.v2:e.v1);return!adj.some(id=>vs[id].owner!==null);});
const vrg=(pid,vs,es)=>es.filter(e=>{if(e.owner!==null)return false;const c=id=>vs[id].owner===pid||es.some(r=>r.owner===pid&&(r.v1===id||r.v2===id));return c(e.v1)||c(e.v2);});
const vsg=(pid,vs,es)=>vsv(vs,es).filter(v=>es.some(e=>e.owner===pid&&(e.v1===v.id||e.v2===v.id)));

// ── Resource utils ────────────────────────────────────────────────────────────
const dist=(tot,bd,res)=>{const r={0:{...res[0]},1:{...res[1]},2:{...res[2]}};bd.hexes.forEach(hex=>{if(hex.num!==tot||(hex.q===bd.robber.q&&hex.r===bd.robber.r))return;const rt=RF[hex.res];if(!rt)return;bd.vertices.forEach(v=>{if(v.owner!==null&&v.hexes.find(h=>h.q===hex.q&&h.r===hex.r))r[v.owner][rt]++;});});return r;};
const canAfford=(type,hand)=>Object.entries(COST[type]).every(([r,n])=>(hand[r]||0)>=n);
const spend=(hand,type)=>{const h={...hand};Object.entries(COST[type]).forEach(([r,n])=>{h[r]-=n;});return h;};
const stealFrom=(res,pid)=>{const av=Object.entries(res[pid]).filter(([,n])=>n>0);if(!av.length)return null;return av[0|Math.random()*av.length][0];};
const autoDiscard=(hand,count,arch)=>{const pri=arch==='farmer'?['lumber','brick','wool','grain','ore']:['ore','grain','wool','brick','lumber'];const h={...hand};let rem=count;for(const r of pri){while(h[r]>0&&rem>0){h[r]--;rem--;}}return h;};

const portRatios=(pid,bd)=>{
  const rat={lumber:4,wool:4,grain:4,brick:4,ore:4};
  bd.ports.forEach(p=>{
    const{x,y}=hxy(p.q,p.r),a1=(p.ang-30)*Math.PI/180,a2=(p.ang+30)*Math.PI/180;
    const v1x=Math.round(x+S*Math.cos(a1)),v1y=Math.round(y+S*Math.sin(a1));
    const v2x=Math.round(x+S*Math.cos(a2)),v2y=Math.round(y+S*Math.sin(a2));
    if(bd.vertices.some(v=>v.owner===pid&&((v.x===v1x&&v.y===v1y)||(v.x===v2x&&v.y===v2y)))){
      if(p.res==='any'){Object.keys(rat).forEach(r=>{rat[r]=Math.min(rat[r],3);});}
      else rat[p.res]=Math.min(rat[p.res],2);
    }
  });
  return rat;
};

// ── Scoring (for position selection after Claude picks action type) ────────────
const exR=(pid,vs)=>{const s=new Set();vs.filter(v=>v.owner===pid).forEach(v=>v.hexes.forEach(h=>{if(h.res!=='desert')s.add(h.res);}));return s;};
const scv=(vtx,arch,ex)=>{let s=0;const rs=new Set();vtx.hexes.forEach(h=>{if(h.num)s+=PIPS[h.num]*10;if(h.res!=='desert')rs.add(h.res);});s+=rs.size*8;rs.forEach(r=>{if(!ex.has(r))s+=6;});vtx.hexes.forEach(h=>{if(!h.num)return;const p=PIPS[h.num];if(arch==='settler'&&(h.res==='forest'||h.res==='hills'))s+=p*7;if(arch==='farmer'&&(h.res==='fields'||h.res==='mountains'||h.res==='pasture'))s+=p*5;});return s+Math.random()*8;};
const bestRoad=(pid,vs,es,arch)=>{const ex=exR(pid,vs);const s=vrg(pid,vs,es).map(e=>({e,s:Math.max(scv(vs[e.v1],arch,ex),scv(vs[e.v2],arch,ex))+Math.random()*3})).sort((a,b)=>b.s-a.s);return s.length?s[0].e.id:undefined;};
const bestSett=(pid,vs,es,arch,pool)=>{const ex=exR(pid,vs);const src=pool||vsv(vs,es);const s=src.map(v=>({v,s:scv(v,arch,ex)})).sort((a,b)=>b.s-a.s);return s.length?s[0].v.id:undefined;};

// ── Claude API ────────────────────────────────────────────────────────────────
const ARCH={
  settler:`You are The Settler in Catan. Road Builder strategy: prioritize wood+brick, build roads aggressively for Longest Road (2VP), expand settlements. Respond JSON only.`,
  farmer:`You are The Farmer in Catan. City Builder strategy: prioritize grain+ore for cities (2VP each), buy dev cards with grain+ore+wool. Respond JSON only.`
};


let _apiKey = '';
const setApiKey = k => { _apiKey = k; };
const claude=async(arch,prompt)=>{
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':_apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:120,system:ARCH[arch],messages:[{role:'user',content:prompt}]})});
    const d=await r.json();
    const txt=d.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    return JSON.parse(txt.replace(/```json|```/g,'').trim());
  }catch(e){return null;}
};

const aiSett=async(arch,valid,pid,vs)=>{
  const ex=exR(pid,vs);
  const opts=valid.slice(0,8).map((v,i)=>{const pips=v.hexes.reduce((s,h)=>s+(h.num?PIPS[h.num]:0),0);return`${i}:${v.hexes.map(h=>h.res.slice(0,3)).join('+')}(${pips}pip)`;}).join(' ');
  const res=await claude(arch,`Place settlement. Options: ${opts}. Covered: ${[...ex].join(',')||'none'}. {"idx":0}`);
  const idx=res&&res.idx!==undefined?res.idx:0;
  return valid[idx]?valid[idx].id:valid[0].id;
};

const aiAction=async(arch,pid,bd,hand,tot)=>{
  const canR=canAfford('road',hand)&&vrg(pid,bd.vertices,bd.edges).length>0;
  const canS=canAfford('settlement',hand)&&vsg(pid,bd.vertices,bd.edges).length>0;
  if(!canR&&!canS)return'end_turn';
  const acts=[];if(canR)acts.push('road');if(canS)acts.push('settlement');acts.push('end_turn');
  const h=Object.entries(hand).filter(([,n])=>n>0).map(([r,n])=>`${n}${r}`).join(' ');
  const res=await claude(arch,`Roll:${tot} Hand:${h||'empty'} VP:${bd.vertices.filter(v=>v.owner===pid).length} Options:[${acts.join(',')}] {"action":"${acts[0]}"}`);
  return(res&&acts.includes(res.action))?res.action:'end_turn';
};

const aiRobber=async(arch,pid,bd)=>{
  const opts=bd.hexes.filter(h=>h.res!=='desert'&&!(h.q===bd.robber.q&&h.r===bd.robber.r)).map((h,i)=>{const opp=bd.vertices.filter(v=>v.owner!==null&&v.owner!==pid&&v.hexes.find(hx=>hx.q===h.q&&hx.r===h.r)).length;return{i,q:h.q,r:h.r,info:`${h.res}(${h.num||0})opp=${opp}`};});
  if(!opts.length)return bd.hexes.find(h=>h.res!=='desert')||bd.hexes[0];
  const res=await claude(arch,`Move robber. ${opts.slice(0,8).map(o=>`${o.i}:${o.info}`).join(' ')} {"idx":0}`);
  const idx=res&&res.idx!==undefined?res.idx:0;
  return opts[idx]||opts[0];
};

const aiTrade=async(arch,pid,hand,give,want)=>{
  if(!Object.entries(want).every(([r,n])=>(hand[r]||0)>=n))return false;
  const h=Object.entries(hand).filter(([,n])=>n>0).map(([r,n])=>`${n}${r}`).join(' ');
  const g=Object.entries(give).filter(([,n])=>n>0).map(([r,n])=>`${n}${r}`).join('+');
  const w=Object.entries(want).filter(([,n])=>n>0).map(([r,n])=>`${n}${r}`).join('+');
  const res=await claude(arch,`Hand:${h||'empty'} Offer:receive ${g} give ${w}. Good? {"accept":false}`);
  return res?Boolean(res.accept):Math.random()>0.4;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function CatanGame(){
  const[bd,setBd]=useState(mkBoard);
  const[st,setSt]=useState(0);
  const[ph,setPh]=useState('setup');
  const[gs,setGs]=useState('roll');
  const[gt,setGt]=useState(0);
  const[dice,setDice]=useState(null);
  const[res,setRes]=useState({0:EMPTY(),1:EMPTY(),2:EMPTY()});
  const[pa,setPa]=useState('settlement');
  const[ps,setPs]=useState(null);
  const[bm,setBm]=useState(null);
  const[dCount,setDCount]=useState(0);
  const[dPick,setDPick]=useState(EMPTY());
  const[stealPids,setStealPids]=useState([]);
  const[bankGive,setBankGive]=useState(null);
  const[trMode,setTrMode]=useState(null);
  const[trGive,setTrGive]=useState(EMPTY());
  const[trWant,setTrWant]=useState(EMPTY());
  const[trRes,setTrRes]=useState([]);
  const[hv,setHv]=useState(null);
  const[he,setHe]=useState(null);
  const[hh,setHh]=useState(null);
  const[log,setLog]=useState(['Place your first settlement — click a green vertex.']);
  const bdr=useRef(bd),rsr=useRef(res);
  useEffect(()=>{bdr.current=bd;},[bd]);
  useEffect(()=>{rsr.current=res;},[res]);
  const addLog=m=>setLog(p=>[m,...p].slice(0,15));
  const cpid=ph==='setup'?SO[st]:gt;
  const isHum=PLAYERS[cpid].type==='human';
  const vp=id=>bd.vertices.filter(v=>v.owner===id).length;

  // ── Setup AI
  useEffect(()=>{
    if(ph!=='setup')return;
    const pid=SO[st];if(PLAYERS[pid].type==='human')return;
    const arch=PLAYERS[pid].type;let done=false;
    const run=async()=>{
      await new Promise(r=>setTimeout(r,700));if(done)return;
      const cur=bdr.current,valid=vsv(cur.vertices,cur.edges);
      if(!valid.length)return;
      const vid=await aiSett(arch,valid,pid,cur.vertices);if(done)return;
      setBd(p=>({...p,vertices:p.vertices.map(v=>v.id===vid?{...v,owner:pid}:v)}));
      addLog(`${PLAYERS[pid].name} places a settlement.`);
      await new Promise(r=>setTimeout(r,600));if(done)return;
      setBd(p=>{const eid=bestRoad(pid,p.vertices,p.edges,arch);if(eid===undefined)return p;addLog(`${PLAYERS[pid].name} builds a road.`);return{...p,edges:p.edges.map(e=>e.id===eid?{...e,owner:pid}:e)};});
      if(st<5)setSt(x=>x+1);else{setPh('game');addLog('Setup done — roll the dice!');}
    };
    run();return()=>{done=true;};
  },[st,ph]);

  // ── Game AI
  useEffect(()=>{
    if(ph!=='game'||gs!=='roll')return;
    if(PLAYERS[gt].type==='human')return;
    const pid=gt,arch=PLAYERS[pid].type;let done=false;
    const run=async()=>{
      await new Promise(r=>setTimeout(r,800));if(done)return;
      const d1=1+(0|Math.random()*6),d2=1+(0|Math.random()*6),tot=d1+d2;
      setDice({d1,d2});addLog(`${PLAYERS[pid].name} rolls ${d1}+${d2}=${tot}.`);
      if(tot===7){
        setRes(p=>{const r={...p};[1,2].forEach(pp=>{const tot2=Object.values(r[pp]).reduce((a,n)=>a+n,0);if(tot2>7)r[pp]=autoDiscard(r[pp],Math.floor(tot2/2),PLAYERS[pp].type);});return r;});
        await new Promise(r=>setTimeout(r,500));if(done)return;
        const hex=await aiRobber(arch,pid,bdr.current);if(done)return;
        setBd(p=>({...p,robber:{q:hex.q,r:hex.r}}));
        const adj=bdr.current.vertices.filter(v=>v.owner!==null&&v.owner!==pid&&v.hexes.find(h=>h.q===hex.q&&h.r===hex.r));
        if(adj.length){const vp2=adj[0|Math.random()*adj.length].owner,st2=stealFrom(rsr.current,vp2);if(st2){setRes(p=>({...p,[pid]:{...p[pid],[st2]:p[pid][st2]+1},[vp2]:{...p[vp2],[st2]:Math.max(0,p[vp2][st2]-1)}}));addLog(`${PLAYERS[pid].name} moves robber & steals!`);}else addLog(`${PLAYERS[pid].name} moves the robber.`);}
        else addLog(`${PLAYERS[pid].name} moves the robber.`);
      }else{setRes(p=>dist(tot,bdr.current,p));addLog(`Resources for ${tot}.`);}
      await new Promise(r=>setTimeout(r,600));if(done)return;
      const action=await aiAction(arch,pid,bdr.current,rsr.current[pid],tot);if(done)return;
      if(action==='road'){const eid=bestRoad(pid,bdr.current.vertices,bdr.current.edges,arch);if(eid!==undefined){setBd(p=>({...p,edges:p.edges.map(e=>e.id===eid?{...e,owner:pid}:e)}));setRes(p=>({...p,[pid]:spend(p[pid],'road')}));addLog(`${PLAYERS[pid].name} builds a road.`);}}
      else if(action==='settlement'){const vid=bestSett(pid,bdr.current.vertices,bdr.current.edges,arch);if(vid!==undefined){setBd(p=>({...p,vertices:p.vertices.map(v=>v.id===vid?{...v,owner:pid}:v)}));setRes(p=>({...p,[pid]:spend(p[pid],'settlement')}));addLog(`${PLAYERS[pid].name} builds a settlement.`);}}
      await new Promise(r=>setTimeout(r,400));if(done)return;
      setDice(null);setGt(x=>(x+1)%3);setGs('roll');addLog(`${PLAYERS[pid].name}'s turn ends.`);
    };
    run();return()=>{done=true;};
  },[gt,gs,ph]);

  // ── Human setup handlers
  const onVS=vid=>{if(!isHum||ph!=='setup'||pa!=='settlement')return;if(!vsv(bd.vertices,bd.edges).find(v=>v.id===vid))return;setBd(p=>({...p,vertices:p.vertices.map(v=>v.id===vid?{...v,owner:0}:v)}));setPs(vid);setPa('road');addLog('You place a settlement. Build a road.');};
  const onES=eid=>{if(!isHum||ph!=='setup'||pa!=='road')return;if(!bd.edges.find(e=>(e.v1===ps||e.v2===ps)&&e.id===eid&&e.owner===null))return;setBd(p=>({...p,edges:p.edges.map(e=>e.id===eid?{...e,owner:0}:e)}));addLog('You build a road.');setPa('settlement');setPs(null);if(st<5)setSt(x=>x+1);else{setPh('game');addLog('Setup done — roll the dice!');}};

  // ── Roll
  const onRoll=()=>{
    if(!isHum||ph!=='game'||gs!=='roll')return;
    const d1=1+(0|Math.random()*6),d2=1+(0|Math.random()*6),tot=d1+d2;
    setDice({d1,d2});addLog(`You roll ${d1}+${d2}=${tot}.`);
    if(tot===7){
      setRes(p=>{const r={...p};[1,2].forEach(pp=>{const t=Object.values(r[pp]).reduce((a,n)=>a+n,0);if(t>7)r[pp]=autoDiscard(r[pp],Math.floor(t/2),PLAYERS[pp].type);});return r;});
      const hTot=Object.values(res[0]).reduce((a,n)=>a+n,0);
      if(hTot>7){const cnt=Math.floor(hTot/2);setDCount(cnt);setDPick(EMPTY());setGs('discard');addLog(`You have ${hTot} cards — discard ${cnt}.`);}
      else{setGs('robber');addLog('Move the robber — click any hex.');}
    }else{setRes(p=>dist(tot,bd,p));addLog(`Resources for ${tot}.`);setGs('action');}
  };

  // ── Discard
  const adjDiscard=(r,delta)=>setDPick(p=>{const nv=Math.max(0,Math.min(res[0][r],p[r]+delta));return{...p,[r]:nv};});
  const dPickTotal=Object.values(dPick).reduce((a,n)=>a+n,0);
  const confirmDiscard=()=>{
    if(dPickTotal!==dCount)return;
    setRes(p=>{const h={...p[0]};Object.entries(dPick).forEach(([r,n])=>{h[r]-=n;});return{...p,0:h};});
    addLog(`You discarded ${dCount} cards.`);setDPick(EMPTY());setGs('robber');addLog('Move the robber — click any hex.');
  };

  // ── Robber
  const onHex=(q,r)=>{
    if(!isHum||ph!=='game'||gs!=='robber')return;
    setBd(p=>({...p,robber:{q,r}}));setHh(null);
    const adj=[...new Set(bd.vertices.filter(v=>v.owner!==null&&v.owner!==0&&v.hexes.find(h=>h.q===q&&h.r===r)).map(v=>v.owner))];
    if(!adj.length){addLog('Robber moved.');setGs('action');}
    else if(adj.length===1){const st2=stealFrom(res,adj[0]);if(st2){setRes(p=>({...p,0:{...p[0],[st2]:p[0][st2]+1},[adj[0]]:{...p[adj[0]],[st2]:Math.max(0,p[adj[0]][st2]-1)}}));addLog(`Stole a ${st2} from ${PLAYERS[adj[0]].name}!`);}else addLog('Robber moved.');setGs('action');}
    else{setStealPids(adj);setGs('steal');addLog('Choose who to steal from.');}
  };
  const onSteal=pid=>{const st2=stealFrom(res,pid);if(st2){setRes(p=>({...p,0:{...p[0],[st2]:p[0][st2]+1},[pid]:{...p[pid],[st2]:Math.max(0,p[pid][st2]-1)}}));addLog(`Stole a ${st2} from ${PLAYERS[pid].name}!`);}else addLog('Nothing to steal.');setStealPids([]);setGs('action');};

  // ── Build (game)
  const onVG=vid=>{if(!isHum||ph!=='game'||gs!=='action'||bm!=='settlement')return;if(!vsg(0,bd.vertices,bd.edges).find(v=>v.id===vid))return;setBd(p=>({...p,vertices:p.vertices.map(v=>v.id===vid?{...v,owner:0}:v)}));setRes(p=>({...p,0:spend(p[0],'settlement')}));addLog('You build a settlement!');setBm(null);};
  const onEG=eid=>{if(!isHum||ph!=='game'||gs!=='action'||bm!=='road')return;if(!vrg(0,bd.vertices,bd.edges).find(e=>e.id===eid))return;setBd(p=>({...p,edges:p.edges.map(e=>e.id===eid?{...e,owner:0}:e)}));setRes(p=>({...p,0:spend(p[0],'road')}));addLog('You build a road!');setBm(null);};

  // ── Bank trade
  const doBankTrade=(give,want)=>{const rat=portRatios(0,bd);setRes(p=>{const h={...p[0]};h[give]-=rat[give];h[want]=(h[want]||0)+1;return{...p,0:h};});addLog(`Bank trade: ${rat[give]}×${give} → 1×${want}`);setBankGive(null);};

  // ── Player trade
  const submitTrade=async()=>{
    if(!Object.values(trGive).some(n=>n>0)||!Object.values(trWant).some(n=>n>0))return;
    setTrMode('waiting');
    const results=[];
    for(const p of PLAYERS.filter(pl=>pl.type!=='human')){const acc=await aiTrade(p.type,p.id,res[p.id],trGive,trWant);results.push({pid:p.id,accepted:acc});}
    setTrRes(results);setTrMode('results');
  };
  const doTrade=pid=>{setRes(p=>{const h0={...p[0]},hp={...p[pid]};Object.entries(trGive).forEach(([r,n])=>{h0[r]-=n;hp[r]=(hp[r]||0)+n;});Object.entries(trWant).forEach(([r,n])=>{h0[r]=(h0[r]||0)+n;hp[r]-=n;});return{...p,0:h0,[pid]:hp};});addLog(`Traded with ${PLAYERS[pid].name}!`);setTrMode(null);setTrRes([]);setTrGive(EMPTY());setTrWant(EMPTY());};

  const onEnd=()=>{if(!isHum||ph!=='game'||gs!=='action')return;setDice(null);setBm(null);setBankGive(null);setTrMode(null);setGt(x=>(x+1)%3);setGs('roll');addLog('Your turn ends.');};

  const reset=()=>{setBd(mkBoard());setSt(0);setPh('setup');setGs('roll');setGt(0);setDice(null);setRes({0:EMPTY(),1:EMPTY(),2:EMPTY()});setPa('settlement');setPs(null);setBm(null);setDCount(0);setDPick(EMPTY());setStealPids([]);setBankGive(null);setTrMode(null);setTrGive(EMPTY());setTrWant(EMPTY());setTrRes([]);setHv(null);setHe(null);setHh(null);setLog(['Place your first settlement — click a green vertex.']);};

  // ── Valid highlight sets
  const vvids=new Set(),veids=new Set();
  if(isHum&&ph==='setup'){if(pa==='settlement')vsv(bd.vertices,bd.edges).forEach(v=>vvids.add(v.id));if(pa==='road'&&ps!==null)bd.edges.filter(e=>(e.v1===ps||e.v2===ps)&&e.owner===null).forEach(e=>veids.add(e.id));}
  if(isHum&&ph==='game'&&gs==='action'){if(bm==='settlement')vsg(0,bd.vertices,bd.edges).forEach(v=>vvids.add(v.id));if(bm==='road')vrg(0,bd.vertices,bd.edges).forEach(e=>veids.add(e.id));}

  // ── Layout
  const PAD=110,xs=COORDS.map(h=>hxy(h.q,h.r).x),ys=COORDS.map(h=>hxy(h.q,h.r).y);
  const vbx=Math.min(...xs)-S-PAD,vby=Math.min(...ys)-S-PAD,vbw=Math.max(...xs)-vbx+S+PAD,vbh=Math.max(...ys)-vby+S+PAD;
  const hand=res[0],robM=isHum&&ph==='game'&&gs==='robber';
  const rat=ph==='game'?portRatios(0,bd):{lumber:4,wool:4,grain:4,brick:4,ore:4};
  const smsg=ph==='setup'?(isHum?(pa==='settlement'?'🏠 Click a green vertex':'🛣 Click a green edge'):`⏳ ${PLAYERS[SO[st]].name} is thinking…`):gs==='discard'?`🃏 Discard ${dCount-dPickTotal} more`:gs==='steal'?'⚔️ Choose who to steal from':isHum?(gs==='roll'?'🎲 Roll the dice':gs==='robber'?'☠️ Click any hex':'Build · Trade · End Turn'):`⏳ ${PLAYERS[gt].name} is thinking…`;

  const cardStyle={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 14px'};
  const miniBtn=(lbl,onClick,disabled,active)=><button onClick={disabled?undefined:onClick} style={{padding:'3px 8px',borderRadius:4,background:active?'rgba(76,155,232,0.25)':'rgba(255,255,255,0.07)',border:`1px solid ${active?'#4c9be8':'rgba(255,255,255,0.15)'}`,color:disabled?'#333':active?'#4c9be8':'#aaa',cursor:disabled?'default':'pointer',fontSize:11}}>{lbl}</button>;

  return(
    <div style={{background:'#060504',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',padding:'12px 12px 24px',fontFamily:"'Palatino Linotype',Palatino,Georgia,serif",userSelect:'none'}}>

      <div style={{color:'#d4a843',fontSize:32,fontWeight:'bold',letterSpacing:12,marginBottom:1,textShadow:'0 0 24px rgba(212,168,67,0.38)'}}>CATAN</div>
      <div style={{color:'#3e2a0e',fontSize:8,letterSpacing:5,marginBottom:8,textTransform:'uppercase'}}>Training Tool</div>

      {ph==='setup'&&<div style={{display:'flex',gap:6,marginBottom:8}}>{SO.map((pid,i)=>{const done=i<st,act=i===st;return (<div key={i} style={{width:act?10:8,height:act?10:8,borderRadius:'50%',background:done?PLAYERS[pid].color:act?'#fff':'rgba(255,255,255,0.12)',border:act?`2px solid ${PLAYERS[pid].color}`:'none',boxShadow:act?`0 0 6px ${PLAYERS[pid].color}`:'none',transition:'all 0.3s'}}/>);})}</div>}

      <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap',justifyContent:'center'}}>
        {PLAYERS.map(p=>{const act=(ph==='setup'&&SO[st]===p.id)||(ph==='game'&&gt===p.id);const sC=bd.vertices.filter(v=>v.owner===p.id).length,rC=bd.edges.filter(e=>e.owner===p.id).length,cards=Object.values(res[p.id]).reduce((a,n)=>a+n,0);return(<div key={p.id} style={{padding:'4px 12px',borderRadius:20,fontSize:10,border:`1.5px solid ${act?p.color:'rgba(255,255,255,0.07)'}`,background:act?`${p.color}1a`:'rgba(255,255,255,0.03)',color:act?p.color:'#3a3a3a',transition:'all 0.3s',boxShadow:act?`0 0 8px ${p.color}33`:'none'}}>{act&&'▶ '}{p.name} <span style={{opacity:0.55,fontSize:9}}>{sC>0?`${sC}🏠`:''}{rC>0?` ${rC}🛣`:''}{ph==='game'?` ${vp(p.id)}VP${p.type!=='human'?` ${cards}🃏`:''}`:''}</span></div>);})}
      </div>

      <div style={{color:isHum?'#d4a843':'#4a3820',fontSize:11,marginBottom:8,minHeight:16,textAlign:'center'}}>{smsg}</div>

      <svg viewBox={`${vbx} ${vby} ${vbw} ${vbh}`} style={{width:'min(96vw,700px)',height:'auto'}}>
        <defs>
          <radialGradient id="og" cx="50%" cy="42%" r="62%"><stop offset="0%" stopColor="#1a4878"/><stop offset="100%" stopColor="#060f1e"/></radialGradient>
          <filter id="hs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.5"/></filter>
        </defs>
        <rect x={vbx} y={vby} width={vbw} height={vbh} fill="url(#og)" rx={22}/>
        {bd.hexes.map((h,i)=>{
          const{x,y}=hxy(h.q,h.r),t=TILES[h.res],red=h.num===6||h.num===8,pips=h.num?PIPS[h.num]:0;
          const isR=bd.robber&&h.q===bd.robber.q&&h.r===bd.robber.r,canR=robM&&!isR,isHH=hh&&hh.q===h.q&&hh.r===h.r;
          return(<g key={i} filter="url(#hs)" onClick={()=>canR&&onHex(h.q,h.r)} onMouseEnter={()=>canR&&setHh({q:h.q,r:h.r})} onMouseLeave={()=>setHh(null)} style={{cursor:canR?'pointer':'default'}}>
            <polygon points={hp(x,y,S-1)} fill={t.bg} stroke="#070503" strokeWidth={2.5} opacity={isR?0.5:1}/>
            <polygon points={hp(x,y,S-6.5)} fill={t.hi} opacity={isR?0.5:1}/>
            {canR&&isHH&&<polygon points={hp(x,y,S-6.5)} fill="rgba(240,60,60,0.3)"/>}
            <polygon points={hp(x,y,S-10.5)} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth={1}/>
            <text x={x} y={y-12} textAnchor="middle" dominantBaseline="middle" fontSize={22} style={{pointerEvents:'none',opacity:isR?0.3:1}}>{t.em}</text>
            {t.lb&&<text x={x} y={y+5} textAnchor="middle" dominantBaseline="middle" fontSize={6.5} fill="rgba(255,255,255,0.3)" style={{pointerEvents:'none'}}>{t.lb}</text>}
            {h.num&&<g style={{pointerEvents:'none'}}>
              <circle cx={x} cy={y+24} r={18} fill={isR?'#444':'#f2e6bc'} stroke={red?'#800000':'#8a6c28'} strokeWidth={1.5}/>
              <text x={x} y={y+24} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold" fill={red?'#c00':'#180800'}>{h.num}</text>
              {Array.from({length:pips},(_,j)=><circle key={j} cx={x+(j-(pips-1)/2)*5.5} cy={y+39} r={2.1} fill={red?'#c00':'#281200'}/>)}
            </g>}
            {isR&&<g style={{pointerEvents:'none'}}><circle cx={x} cy={y} r={14} fill="#0d0d0d" stroke="#555" strokeWidth={1.8} opacity={0.92}/><text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={14}>☠️</text></g>}
          </g>);
        })}
        {bd.edges.filter(e=>e.owner!==null).map(e=>{const v1=bd.vertices[e.v1],v2=bd.vertices[e.v2];return (<line key={e.id} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={PLAYERS[e.owner].color} strokeWidth={6} strokeLinecap="round" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'}}/>);} )}
        {bd.edges.filter(e=>veids.has(e.id)).map(e=>{const v1=bd.vertices[e.v1],v2=bd.vertices[e.v2],hov=he===e.id;return (<line key={e.id} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={hov?PLAYERS[0].color:'rgba(78,196,110,0.65)'} strokeWidth={hov?8:5} strokeLinecap="round" strokeDasharray={hov?'none':'7,4'} style={{cursor:'pointer'}} onClick={()=>ph==='setup'?onES(e.id):onEG(e.id)} onMouseEnter={()=>setHe(e.id)} onMouseLeave={()=>setHe(null)}/>);} )}
        {bd.vertices.filter(v=>v.owner!==null).map(v=>(<g key={v.id} style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.7))'}}>
          <circle cx={v.x} cy={v.y} r={10} fill={PLAYERS[v.owner].color} stroke="white" strokeWidth={2.5}/>
          <polygon points={`${v.x},${v.y-7} ${v.x-5.5},${v.y-1} ${v.x+5.5},${v.y-1}`} fill="rgba(255,255,255,0.85)"/>
          <rect x={v.x-4} y={v.y-1} width={8} height={7} fill="rgba(255,255,255,0.85)" rx={1}/>
        </g>))}
        {bd.vertices.filter(v=>vvids.has(v.id)).map(v=>{const hov=hv===v.id;return (<circle key={v.id} cx={v.x} cy={v.y} r={hov?10:7} fill={hov?PLAYERS[0].color:'rgba(78,196,110,0.55)'} stroke={hov?'white':'rgba(255,255,255,0.45)'} strokeWidth={hov?2.5:1.5} style={{cursor:'pointer'}} onClick={()=>ph==='setup'?onVS(v.id):onVG(v.id)} onMouseEnter={()=>setHv(v.id)} onMouseLeave={()=>setHv(null)}/>);} )}
        {bd.ports.map((p,i)=>{const{x,y}=hxy(p.q,p.r),rad=p.ang*Math.PI/180,ex=x+Math.cos(rad)*(S+48),ey=y+Math.sin(rad)*(S+48);return(<g key={i}><line x1={x+Math.cos(rad)*(S-2)} y1={y+Math.sin(rad)*(S-2)} x2={ex} y2={ey} stroke="#b89028" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}/><rect x={ex-20} y={ey-16} width={40} height={32} fill={p.bg} stroke="#d4a843" strokeWidth={1.3} rx={5} opacity={0.92}/><text x={ex} y={ey-4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">{p.rt}</text><text x={ex} y={ey+10} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.82)">{p.sym}</text></g>);})}
      </svg>

      {/* ── Game controls ── */}
      {ph==='game'&&(
        <div style={{marginTop:12,width:'min(96vw,700px)',display:'flex',flexDirection:'column',gap:10}}>

          {/* Dice + roll */}
          {isHum&&gs==='roll'&&<div style={{display:'flex',justifyContent:'center'}}><B gold onClick={onRoll}>🎲 Roll Dice</B></div>}
          {dice&&<div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'center'}}>
            {[dice.d1,dice.d2].map((d,i)=><div key={i} style={{width:50,height:50,borderRadius:10,background:'#f2e6bc',border:'2px solid #9a7830',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:'bold',color:'#180800',boxShadow:'0 3px 10px rgba(0,0,0,0.4)'}}>{d}</div>)}
            <div style={{color:'#d4a843',fontSize:22,fontWeight:'bold',marginLeft:4}}>= {dice.d1+dice.d2}</div>
          </div>}

          {/* Discard panel */}
          {isHum&&gs==='discard'&&<div style={cardStyle}>
            <div style={{color:'#e85c5c',fontWeight:'bold',marginBottom:10}}>Discard {dCount} cards ({dPickTotal}/{dCount} selected)</div>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:12}}>
              {RES.map(r=><div key={r} style={{textAlign:'center'}}>
                <div style={{fontSize:20}}>{RE[r]}</div>
                <div style={{color:'#888',fontSize:10,margin:'2px 0'}}>{hand[r]} in hand</div>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <button onClick={()=>adjDiscard(r,-1)} style={{background:'#2a1a0a',border:'1px solid #555',color:'white',borderRadius:4,width:22,height:22,cursor:'pointer'}}>-</button>
                  <span style={{color:'#e85c5c',fontWeight:'bold',minWidth:16,textAlign:'center',fontSize:14}}>{dPick[r]}</span>
                  <button onClick={()=>adjDiscard(r,1)} disabled={dPick[r]>=hand[r]||dPickTotal>=dCount} style={{background:'#2a1a0a',border:'1px solid #555',color:'white',borderRadius:4,width:22,height:22,cursor:'pointer',opacity:dPick[r]>=hand[r]||dPickTotal>=dCount?0.4:1}}>+</button>
                </div>
              </div>)}
            </div>
            <B gold disabled={dPickTotal!==dCount} onClick={confirmDiscard}>Confirm Discard ({dPickTotal}/{dCount})</B>
          </div>}

          {/* Steal panel */}
          {isHum&&gs==='steal'&&<div style={cardStyle}>
            <div style={{color:'#d4a843',fontWeight:'bold',marginBottom:10}}>Choose who to steal from:</div>
            <div style={{display:'flex',gap:10}}>{stealPids.map(pid=><B key={pid} onClick={()=>onSteal(pid)} style={{borderColor:PLAYERS[pid].color,color:PLAYERS[pid].color}}>{PLAYERS[pid].name}</B>)}</div>
          </div>}

          {/* Action panel */}
          {isHum&&gs==='action'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {/* Build buttons */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <B active={bm==='road'} disabled={!canAfford('road',hand)} onClick={()=>setBm(m=>m==='road'?null:'road')}>🛣 Road{!canAfford('road',hand)?' 🌲🧱':''}</B>
              <B active={bm==='settlement'} disabled={!canAfford('settlement',hand)||!vsg(0,bd.vertices,bd.edges).length} onClick={()=>setBm(m=>m==='settlement'?null:'settlement')}>🏠 Settle{!canAfford('settlement',hand)?' 🌲🧱🐑🌾':''}</B>
              <B onClick={()=>setTrMode('propose')}>🤝 Trade</B>
              <B onClick={onEnd}>✓ End Turn</B>
            </div>

            {/* Hand */}
            <div style={{...cardStyle,display:'flex',gap:16}}>
              {RES.map(r=><div key={r} style={{textAlign:'center',color:hand[r]>0?'#c8a84e':'#2e2e2e',minWidth:24}}>
                <div style={{fontSize:18}}>{RE[r]}</div>
                <div style={{fontWeight:'bold',fontSize:12}}>{hand[r]}</div>
              </div>)}
            </div>

            {/* Bank trade */}
            <div style={cardStyle}>
              <div style={{color:'#888',fontSize:10,marginBottom:8,letterSpacing:'1px',textTransform:'uppercase'}}>Bank Trade</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {RES.map(r=>{const ratio=rat[r],can=hand[r]>=ratio;return(<div key={r} style={{display:'flex',alignItems:'center',gap:4}}>
                  {miniBtn(`${ratio}× ${RE[r]} →`,()=>setBankGive(bankGive===r?null:r),!can,bankGive===r)}
                  {bankGive===r&&RES.filter(w=>w!==r).map(w=>miniBtn(RE[w],()=>doBankTrade(r,w),false,false))}
                </div>);})}
              </div>
            </div>

            {/* Player trade */}
            {trMode==='propose'&&<div style={cardStyle}>
              <div style={{color:'#d4a843',fontWeight:'bold',marginBottom:10}}>Propose Trade</div>
              <div style={{display:'flex',gap:20,marginBottom:12}}>
                <div>
                  <div style={{color:'#4c9be8',fontSize:10,marginBottom:6}}>I OFFER</div>
                  <div style={{display:'flex',gap:8}}>{RES.map(r=><div key={r} style={{textAlign:'center'}}>
                    <div style={{fontSize:16}}>{RE[r]}</div>
                    <div style={{display:'flex',alignItems:'center',gap:3,marginTop:2}}>
                      <button onClick={()=>setTrGive(p=>({...p,[r]:Math.max(0,p[r]-1)}))} style={{background:'#2a1a0a',border:'1px solid #444',color:'white',borderRadius:3,width:18,height:18,cursor:'pointer',fontSize:10}}>-</button>
                      <span style={{color:'#4c9be8',minWidth:12,textAlign:'center',fontSize:12}}>{trGive[r]}</span>
                      <button onClick={()=>setTrGive(p=>({...p,[r]:Math.min(hand[r],p[r]+1)}))} disabled={trGive[r]>=hand[r]} style={{background:'#2a1a0a',border:'1px solid #444',color:'white',borderRadius:3,width:18,height:18,cursor:'pointer',fontSize:10,opacity:trGive[r]>=hand[r]?0.4:1}}>+</button>
                    </div>
                  </div>)}</div>
                </div>
                <div>
                  <div style={{color:'#4ec46e',fontSize:10,marginBottom:6}}>I WANT</div>
                  <div style={{display:'flex',gap:8}}>{RES.map(r=><div key={r} style={{textAlign:'center'}}>
                    <div style={{fontSize:16}}>{RE[r]}</div>
                    <div style={{display:'flex',alignItems:'center',gap:3,marginTop:2}}>
                      <button onClick={()=>setTrWant(p=>({...p,[r]:Math.max(0,p[r]-1)}))} style={{background:'#2a1a0a',border:'1px solid #444',color:'white',borderRadius:3,width:18,height:18,cursor:'pointer',fontSize:10}}>-</button>
                      <span style={{color:'#4ec46e',minWidth:12,textAlign:'center',fontSize:12}}>{trWant[r]}</span>
                      <button onClick={()=>setTrWant(p=>({...p,[r]:p[r]+1}))} style={{background:'#2a1a0a',border:'1px solid #444',color:'white',borderRadius:3,width:18,height:18,cursor:'pointer',fontSize:10}}>+</button>
                    </div>
                  </div>)}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <B gold disabled={!Object.values(trGive).some(n=>n>0)||!Object.values(trWant).some(n=>n>0)} onClick={submitTrade}>Send Offer</B>
                <B onClick={()=>setTrMode(null)}>Cancel</B>
              </div>
            </div>}
            {trMode==='waiting'&&<div style={{...cardStyle,textAlign:'center',color:'#888'}}>⏳ Asking players…</div>}
            {trMode==='results'&&<div style={cardStyle}>
              <div style={{color:'#d4a843',fontWeight:'bold',marginBottom:10}}>Trade Responses</div>
              {trRes.map(({pid,accepted})=><div key={pid} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{color:PLAYERS[pid].color}}>{PLAYERS[pid].name}</span>
                {accepted?<div style={{display:'flex',alignItems:'center',gap:8}}><span style={{color:'#4ec46e'}}>✓ Accepts</span><B onClick={()=>doTrade(pid)}>Complete Trade</B></div>:<span style={{color:'#e85c5c'}}>✗ Declines</span>}
              </div>)}
              <B onClick={()=>{setTrMode(null);setTrRes([]);setTrGive(EMPTY());setTrWant(EMPTY());}}>Close</B>
            </div>}
          </div>}
        </div>
      )}

      {/* ── Cheat sheet + log ── */}
      <div style={{marginTop:12,width:'min(96vw,700px)',display:'flex',gap:10,flexWrap:'wrap'}}>
        <div style={{...cardStyle,flex:'0 0 auto'}}>
          <div style={{color:'#888',fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8}}>Build Costs</div>
          {[['🛣','Road','🌲 🧱'],['🏠','Settle','🌲 🧱 🐑 🌾'],['🏙','City','🌾🌾 ⛰⛰⛰'],['🃏','Dev','🌾 🐑 ⛰']].map(([ic,nm,co])=>(
            <div key={nm} style={{display:'flex',justifyContent:'space-between',gap:16,marginBottom:4,fontSize:11}}>
              <span style={{color:'#7a6040'}}>{ic} {nm}</span>
              <span style={{color:'#c8a84e'}}>{co}</span>
            </div>
          ))}
        </div>
        <div style={{...cardStyle,flex:'1 1 0',maxHeight:100,overflow:'hidden'}}>
          {log.slice(0,5).map((e,i)=><div key={i} style={{color:i===0?'#9a7838':'#2e1f0a',fontSize:10,lineHeight:1.8}}>{e}</div>)}
        </div>
      </div>

      <button onClick={reset} style={{marginTop:12,padding:'9px 28px',background:'linear-gradient(135deg,#c09028,#7a5810)',color:'#060504',border:'none',borderRadius:7,fontSize:11,fontWeight:'bold',cursor:'pointer',letterSpacing:'2.5px',textTransform:'uppercase'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.82'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>🎲 New Game</button>
    </div>
  );
}

function B({children,onClick,gold,active,disabled,style}){
  return (<button onClick={disabled?undefined:onClick} style={{padding:'8px 14px',borderRadius:7,fontSize:11,fontWeight:'bold',letterSpacing:'0.5px',textTransform:'uppercase',cursor:disabled?'default':'pointer',transition:'all 0.2s',opacity:disabled?0.4:1,border:active?'2px solid #4c9be8':'1.5px solid rgba(255,255,255,0.12)',background:gold?'linear-gradient(135deg,#c09028,#7a5810)':active?'rgba(76,155,232,0.18)':'rgba(255,255,255,0.06)',color:gold?'#060504':active?'#4c9be8':disabled?'#444':'#9a8060',...style}}>{children}</button>);
}

export default function App() {
  const [apiKey, setKey] = React.useState('');
  const [started, setStarted] = React.useState(false);

  const handleStart = () => {
    const k = apiKey.trim();
    if (!k.startsWith('sk-ant-')) {
      alert('Please enter a valid Anthropic API key (starts with sk-ant-)');
      return;
    }
    setApiKey(k);
    setStarted(true);
  };

  if (!started) {
    return (
      <div style={{background:'#060504',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'Palatino Linotype',Palatino,Georgia,serif",padding:24}}>
        <div style={{color:'#d4a843',fontSize:48,fontWeight:'bold',letterSpacing:14,marginBottom:4,textShadow:'0 0 32px rgba(212,168,67,0.4)'}}>CATAN</div>
        <div style={{color:'#5a3e1a',fontSize:10,letterSpacing:6,marginBottom:48,textTransform:'uppercase'}}>Training Tool</div>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:32,maxWidth:440,width:'100%'}}>
          <div style={{color:'#c8a84e',fontSize:16,fontWeight:'bold',marginBottom:8}}>Enter your Anthropic API Key</div>
          <div style={{color:'#5a4020',fontSize:12,lineHeight:1.7,marginBottom:20}}>
            The AI opponents are powered by Claude. You need a free Anthropic API key to play.<br/><br/>
            Get one at <span style={{color:'#4c9be8'}}>console.anthropic.com</span> → API Keys.<br/>
            Your key is never stored or sent anywhere except directly to Anthropic.
          </div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            style={{width:'100%',padding:'10px 14px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:7,color:'white',fontSize:13,marginBottom:16,outline:'none',fontFamily:'monospace'}}
          />
          <button
            onClick={handleStart}
            style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#c09028,#7a5810)',color:'#060504',border:'none',borderRadius:7,fontSize:13,fontWeight:'bold',cursor:'pointer',letterSpacing:'2px',textTransform:'uppercase'}}>
            🎲 Start Game
          </button>
        </div>
      </div>
    );
  }

  return <CatanGame />;
}
