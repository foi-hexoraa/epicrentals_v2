// Paste this entire file into the existing Cloudflare Worker. Keep SUPERSAAS_API_KEY as a Secret.
const ORIGINS=new Set(['https://epic-rentals-refresh.satinycabin66.chatgpt.site','https://www.epicrentals.in','https://epicrentals.in']);
const HOUR=3600000,DAY=24*HOUR,BUFFER=2*HOUR;
const SOUNDBAR='SNDBAR1';
const RESOURCES=['PS1','PS2','PS3','PS4','CON1','CON2',SOUNDBAR];
const CALENDAR_TTL=0;
const capabilities={soundbar:true,alternatives:true,calendarCacheSeconds:0};
const localDate=t=>new Date(t+5.5*HOUR).toISOString().slice(0,10);
async function calendarBookings(env,to,fresh=false){
 const bookings=await load(env,to);return {bookings,checkedAt:Date.now()};
}
export function alternativeSlots(windows,start,days){
 const results=[],seen=new Set();
 for(const [a,b] of windows){
  // Chennai is UTC+05:30; scan on local whole-hour boundaries.
  let candidate=Math.ceil((Math.max(a,start)+5.5*HOUR)/HOUR)*HOUR-5.5*HOUR;
  for(;candidate+days*DAY<=b&&candidate<=start+30*DAY;candidate+=HOUR){
   const date=new Date(candidate+5.5*HOUR),hour=date.getUTCHours(),day=localDate(candidate);
   if(hour<8||hour>21||seen.has(day))continue;
   seen.add(day);results.push({start:candidate,finish:candidate+days*DAY});
  }
 }
 return results.sort((a,b)=>a.start-b.start).slice(0,3);
}
const parse=t=>{if(typeof t!=='string')return NaN;const s=t.replace(' ','T');return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(s)?s:s+'+05:30')};
export function freeWindows(bookings,from,to){
 const blocked=bookings.map(b=>[parse(b.start)-BUFFER,parse(b.finish)+BUFFER]).sort((a,b)=>a[0]-b[0]);
 let cursor=from;const free=[];for(const [a,b] of blocked){if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)throw Error('Invalid booking');if(b<=cursor)continue;if(a>=to)break;if(a>cursor)free.push([cursor,Math.min(a,to)]);cursor=Math.max(cursor,b);if(cursor>=to)break}if(cursor<to)free.push([cursor,to]);return free;
}
const intersect=(a,b)=>a.flatMap(x=>b.map(y=>[Math.max(x[0],y[0]),Math.min(x[1],y[1])]).filter(z=>z[1]>z[0]));
export function soundbarWindows(bookings,from,to){return freeWindows(bookings.filter(b=>(b.res_name||b.resource)===SOUNDBAR),from,to)}
export function calculate(bookings,from,to,controllers,withSoundbar=false){
 const resources=['PS1','PS2','PS3','PS4','CON1','CON2'];
 const free=Object.fromEntries(resources.map(r=>[r,freeWindows(bookings.filter(b=>(b.res_name||b.resource)===r),from,to)]));
 let windows=resources.slice(0,4).flatMap(r=>controllers<=2?free[r]:controllers===3?[...intersect(free[r],free.CON1),...intersect(free[r],free.CON2)]:intersect(intersect(free[r],free.CON1),free.CON2));
 // Keep maximal continuous windows. Never merge windows from different consoles.
 windows=windows.filter((w,i,a)=>!a.some((v,j)=>j!==i&&v[0]<=w[0]&&v[1]>=w[1]&&(v[0]<w[0]||v[1]>w[1]||j<i)));
 if(withSoundbar)windows=intersect(windows,soundbarWindows(bookings,from,to));
 return windows.sort((a,b)=>a[0]-b[0]);
}
async function load(env,to){
 const all=[];for(let offset=0;offset<10000;offset+=500){const u=new URL('https://www.supersaas.com/api/range/831101.json');u.search=new URLSearchParams({from:'2000-01-01',to:new Date(to+DAY).toISOString().slice(0,10),limit:'500',offset:String(offset)});const r=await fetch(u,{headers:{Authorization:'Basic '+btoa('Epic_Rentals:'+env.SUPERSAAS_API_KEY)},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('SuperSaaS unavailable');const d=await r.json();if(!Array.isArray(d.bookings))throw Error('Unexpected response');for(const b of d.bookings){if(b.deleted===true||b.deleted==='true')continue;const name=b.res_name||b.resource;if(!RESOURCES.includes(name))throw Error('Resource mapping needs verification');all.push(b)}if(d.bookings.length<500)return all}throw Error('Too many bookings');
}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin'};if(ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='Content-Type';headers['Access-Control-Allow-Methods']='POST, OPTIONS'}const reply=(data,status=200)=>Response.json(data,{status,headers});
 if(origin&&!ORIGINS.has(origin))return reply({status:'unknown'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method==='GET')return reply({version:3,status:'Availability service running',bufferMinutes:120,capabilities});
 if(request.method!=='POST')return reply({status:'unknown'},405);
 try{const b=await request.json();if(!env.SUPERSAAS_API_KEY)throw Error('Missing secret');
 if(b.item!==undefined&&!['ps5','soundbar'].includes(b.item)||b.soundbar!==undefined&&typeof b.soundbar!=='boolean'||b.refresh!==undefined&&typeof b.refresh!=='boolean')return reply({status:'unknown'},400);
 const standalone=b.item==='soundbar',controllers=standalone?2:Number(b.controllers);
 const available=(bookings,from,to)=>standalone?soundbarWindows(bookings,from,to):calculate(bookings,from,to,controllers,b.soundbar===true);
 if(b.action==='calendar'){
  if(!/^\d{4}-\d{2}$/.test(b.month)||![1,2,3,4].includes(controllers))return reply({status:'unknown'},400);
  const from=parse(b.month+'-01T00:00:00'),now=Date.now();if(!Number.isFinite(from)||localDate(from)!==b.month+'-01'||from<now-32*DAY||from>now+366*DAY)return reply({status:'unknown'},400);
  // Legacy clients retain their 124-day window. New clients may request fewer days.
  const span=b.horizonDays===undefined?124:b.horizonDays;
  if(!Number.isInteger(span)||span<1||span>124)return reply({status:'unknown'},400);
  const to=from+span*DAY,entry=await calendarBookings(env,to,b.refresh===true);
  const windows=available(entry.bookings,Math.max(from,now),to);
  return reply({version:3,status:'ok',bufferMinutes:120,capabilities,checkedAt:new Date(entry.checkedAt).toISOString(),validUntil:new Date(entry.checkedAt+CALENDAR_TTL).toISOString(),from:Math.max(from,now),to,windows});
 }
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(b.start)||!Number.isInteger(b.days)||b.days<1||b.days>90||!standalone&&!['1','2','3','4','More than 4'].includes(String(b.controllers)))return reply({status:'unknown'},400);
 if(!standalone&&b.controllers==='More than 4')return reply({status:'manual'});
 const from=parse(b.start),to=from+b.days*DAY;
 if(!Number.isFinite(from)||localDate(from)!==b.start.slice(0,10)||from<=Date.now())return reply({status:'unknown'},400);
 const hour=Number(b.start.slice(11,13)),minute=Number(b.start.slice(14,16));
 if(hour<8||hour>21||minute>59||hour===21&&minute!==0)return reply({status:'unknown',message:'Choose a time between 8 AM and 9 PM.'},400);
 const alternatives=b.action==='alternatives',until=alternatives?to+30*DAY:to;
 // Exact checks and alternatives always fetch fresh bookings, bypassing calendar cache.
 const bookings=await load(env,until+BUFFER),windows=available(bookings,from,until);
 const status=windows.some(w=>w[0]<=from&&w[1]>=to)?'available':'unavailable';
 return reply({version:3,status,checkedAt:new Date().toISOString(),...(alternatives?{alternatives:alternativeSlots(windows,from,b.days)}:{})});
 }catch{return reply({status:'unknown',version:3},503)}
}};
