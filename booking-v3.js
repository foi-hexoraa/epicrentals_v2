const ENDPOINT='https://bold-river-4f00.epicrentalschennai.workers.dev/';
const $=id=>document.getElementById(id),DAY=86400000,HOUR=3600000;
const local=ms=>new Date(ms+19800000).toISOString().slice(0,16),today=local(Date.now()).slice(0,10);
const stamp=(date,time='00:00')=>Date.parse(date+'T'+time+':00+05:30');
const fmt=ms=>new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}).format(ms);
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const duration=()=>Number($('days').value==='custom'?$('custom').value:$('days').value);
let month=today.slice(0,7),windows=[],ready=false,sequence=0,desiredControllers=null,checking=false,verified='',verifiedAt=0;
const selectedPeriod=()=>[$('start').value,$('time').value,duration(),$('controllers').value,$('sbar-addon').checked].join('|');
const filterKey=()=>$('controllers').value+'|'+$('sbar-addon').checked;
function track(event){fetch('/api/metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{})}
function quote(){const q=estimateRental($('start').value,duration(),Number($('controllers').value),$('time').value);if(!q.custom){q.soundbar=$('sbar-addon').checked?accessoryRate(duration(),'soundbar'):0;q.delivery=$('delivery').value==='local'?PRICING_CONFIG.delivery:0;q.deliveryUnknown=$('delivery').value==='far';q.total+=q.soundbar+q.delivery}return q}
function syncControllers(){
 const q=estimateRental($('start').value,duration(),1,$('time').value||'10:00');
 const included=q.custom?1:q.included;
 if($('controllers').value!=='More than 4')$('controllers').value=String(Math.min(4,Math.max(included,desiredControllers||included)));
 for(const option of $('controllers').options){const n=Number(option.value);if(Number.isFinite(n)){option.disabled=n<included;option.textContent=n+' controller'+(n>1?'s':'')+(n===included?' · included':n>included?' · +'+money((n-included)*accessoryRate(duration()||1)):'')}}
 $('controller-note').textContent=q.custom?'Included controllers are confirmed with your quote.':'Your pack includes '+included+' controller'+(included>1?'s':'')+'.'+(Number($('controllers').value)>included?' Extra controllers: '+money((Number($('controllers').value)-included)*accessoryRate(duration()))+'.':' Choose more above if needed.');
}
function renderEstimate(){
 const box=$('estimate');box.replaceChildren(create('h4','','Your rental estimate'));
 const q=quote(),t=stamp($('start').value,$('time').value);
 $('return-preview').textContent=Number.isFinite(t)&&duration()>0?'Return: '+fmt(t+duration()*DAY):'Your return date and time will appear here.';
 if(q.custom){box.append(create('p','note',!$('start').value?'Choose your pickup date, time and duration to see your estimate.':q.reason));updateSticky();return}
 const dl=create('dl');const row=(label,value,total=false)=>{const r=create('div','estimate-row'+(total?' estimate-total':''));r.append(create('dt','',label),create('dd','',value));dl.append(r)};
 row('Pickup',fmt(t));row('Return',fmt(t+duration()*DAY));
 for(const line of q.lines)row(line.label,money(line.amount));
 row('Controllers included',String(q.included));if(q.extraCount)row(q.extraCount+' extra controller'+(q.extraCount>1?'s':''),money(q.extraTotal));
 if(q.soundbar)row('Soundbar add-on',money(q.soundbar));
 row('Delivery & pickup',q.deliveryUnknown?'Additional · quote required':q.delivery?money(q.delivery):'Self pickup · Free');
 row(q.deliveryUnknown?'Subtotal before delivery':'Estimated total',money(q.total),true);
 row('50% advance'+(q.deliveryUnknown?' on subtotal':''),money(Math.ceil(q.total/2)));
 row('Balance on receipt'+(q.deliveryUnknown?' before delivery charge':''),money(q.total-Math.ceil(q.total/2)));
 box.append(dl,create('p','note',q.deliveryUnknown?'Delivery charges are additional. Our team will confirm the full total and advance on WhatsApp.':'Booking is confirmed after our team confirms the details and receives your advance. No security deposit.'));
 updateSticky();
}
function slots(date){const out=[];for(let hour=8;hour<=21;hour++){const t=stamp(date,String(hour).padStart(2,'0')+':00');if(t>Date.now()&&windows.some(w=>w[0]<=t&&w[1]>=t+DAY))out.push(t)}return out}
function dayDescription(date){if(!date)return '';const selected='Selected: '+new Date(date+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});if(!ready||date.slice(0,7)!==month)return selected+'. Check your selected period below.';const s=slots(date);return selected+'. '+(s.length?'Earliest available start: '+fmt(s[0]):'Unavailable for a 24-hour rental. Try alternative dates below.')}
function draw(){const first=new Date(month+'-01T00:00:00Z'),total=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();$('month-title').textContent=first.toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'UTC'});$('calendar').replaceChildren();for(let i=0;i<(first.getUTCDay()+6)%7;i++)$('calendar').append(create('span'));for(let d=1;d<=total;d++){const date=month+'-'+String(d).padStart(2,'0'),open=ready&&slots(date).length>0,b=create('button','date-cell '+(!ready?'unknown':open?'open':''),String(d));b.type='button';b.disabled=date<today;b.classList.toggle('selected',date===$('start').value);b.setAttribute('aria-pressed',String(date===$('start').value));b.setAttribute('aria-label',date+(ready?(open?' — available':' — unavailable'):' — availability unverified'));if(ready&&date>=today)b.append(create('span','date-mark',open?'✓':'–'));b.onclick=()=>{$('start').value=date;datesChanged(true)};$('calendar').append(b)}$('prev').disabled=month<=today.slice(0,7);$('day-window').textContent=dayDescription($('start').value)}
function fillTimes(auto=false){const previous=$('time').value;$('time').replaceChildren(create('option','','Choose a preferred time'));$('time').options[0].value='';for(let h=8;h<=21;h++){const value=String(h).padStart(2,'0')+':00',t=stamp($('start').value,value),o=create('option','',(h%12||12)+':00 '+(h>=12?'PM':'AM'));o.value=value;if(ready&&$('start').value&&!windows.some(w=>w[0]<=t&&w[1]>=t+DAY))o.textContent+=' · unavailable';$('time').append(o)}if(previous)$('time').value=previous;if(auto&&!previous&&ready){const first=slots($('start').value)[0];if(first)$('time').value=local(first).slice(11)}}
function invalidate(){verified='';verifiedAt=0;$('continue-booking').hidden=true;$('booking-next-step').hidden=true;$('alternatives').replaceChildren();$('availability').className='';$('availability').textContent='Check your selected period to confirm live availability.';updateSticky()}
function result(){invalidate();renderEstimate();$('day-window').textContent=dayDescription($('start').value);saveDraft()}
function payload(){return {start:$('start').value+'T'+$('time').value,days:duration(),controllers:$('controllers').value,soundbar:$('sbar-addon').checked}}
async function requestAvailability(body){const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok||data.version!==3)throw Error('Unable to check availability');return data}
function nextMonth(value,delta=1){const date=new Date(value+'-01T00:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);return date.toISOString().slice(0,7)}
async function fetchMonth(value,filters){const [controllers,soundbar]=filters.split('|'),daysInMonth=new Date(Number(value.slice(0,4)),Number(value.slice(5)),0).getDate();const data=await requestAvailability({action:'calendar',month:value,controllers,soundbar:soundbar==='true',horizonDays:daysInMonth+90,refresh:true});if(data.status!=='ok'||data.bufferMinutes!==120||!Array.isArray(data.windows)||!data.windows.every(w=>Array.isArray(w)&&w.length===2&&w.every(Number.isFinite)&&w[1]>=w[0]))throw Error('Invalid availability response');return data}
async function load(force=true,quiet=false){
 const token=++sequence,view=month,filters=filterKey();
 if($('controllers').value==='More than 4'){ready=false;windows=[];$('calendar-status').textContent='Please request a custom controller setup on WhatsApp.';draw();showManual();return}
 if(!quiet){ready=false;windows=[];draw();$('calendar-status').textContent='Checking live availability…'}
 invalidate();
 try{const data=await fetchMonth(view,filters);if(token!==sequence||filters!==filterKey()||view!==month)return;windows=data.windows;ready=true;$('calendar-status').textContent='Live availability · checked '+new Date(data.checkedAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit',hour12:true});fillTimes();draw();renderEstimate();
  // Load the next month automatically, without delaying the visible month.
  fetchMonth(nextMonth(view),filters).catch(()=>{});
 }catch{if(token!==sequence)return;ready=false;windows=[];$('calendar-status').textContent='Unable to check availability. Please retry.';$('availability').textContent='Live availability could not be verified. Retry or ask our team on WhatsApp.';draw();showManual()}
}
function showManual(){const button=$('continue-booking');button.hidden=false;button.textContent='Ask our team on WhatsApp';$('booking-next-step').hidden=false;$('booking-next-step').textContent='Your dates are unverified. Our team will check them before confirming.';updateSticky()}
function datesChanged(auto=false){const old=filterKey();fillTimes(auto);syncControllers();draw();result();if($('start').value&&$('start').value.slice(0,7)!==month){month=$('start').value.slice(0,7);load()}else if(old!==filterKey())load()}
function validateBooking(includeLocation=false){const form=$('enquire');for(const node of form.querySelectorAll('[aria-invalid=true]'))node.removeAttribute('aria-invalid');$('booking-error').textContent='';let error='',field;
 if(!$('start').value||$('start').value<today){error='Choose a future pickup date.';field=$('start')}
 else if(!$('time').value||stamp($('start').value,$('time').value)<=Date.now()){error='Choose a future pickup time.';field=$('time')}
 else if(!Number.isInteger(duration())||duration()<1||duration()>90){error='Choose a rental duration of 1–90 days.';field=$('days').value==='custom'?$('custom'):$('days')}
 else if(includeLocation&&!$('location').value.trim()){error='Enter your pickup or delivery area.';field=$('location')}
 if(field){field.setAttribute('aria-invalid','true');field.setCustomValidity(error);field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});field.focus();$('booking-error').textContent=error;return false}return true;
}
function suggest(label,t,days){const box=create('div','alternative'),q=estimateRental(local(t).slice(0,10),days,Number($('controllers').value),local(t).slice(11));box.append(create('strong','',label),create('p','',fmt(t)+' → '+fmt(t+days*DAY)+(q.custom?'':' · '+money(q.total)+' console & controllers')));const button=create('button','btn orange','Use these dates');button.type='button';button.onclick=()=>{$('start').value=local(t).slice(0,10);$('time').value=local(t).slice(11);$('days').value=[1,2,3,4,7].includes(days)?String(days):'custom';$('custom').value=days;$('custom-days').hidden=$('days').value!=='custom';datesChanged();$('enquire').scrollIntoView({behavior:'smooth',block:'start'})};box.append(button);$('alternatives').append(box)}
async function checkExact(){
 if(checking||!validateBooking())return false;
 if($('controllers').value==='More than 4'){showManual();return false}
 const signature=selectedPeriod();checking=true;$('check').disabled=true;updateSticky();$('availability').className='';$('availability').textContent='Checking your exact rental period…';$('alternatives').replaceChildren();track('availability_check');
 try{const data=await requestAvailability(payload());if(signature!==selectedPeriod())return false;if(!['available','unavailable'].includes(data.status))throw Error('Unverified');
  if(data.status==='available'){verified=signature;verifiedAt=Date.now();$('availability').className='good';$('availability').textContent='Available for your selected dates. Your booking is confirmed after our team’s confirmation and advance payment.';$('continue-booking').hidden=false;$('continue-booking').textContent='Continue on WhatsApp';$('booking-next-step').hidden=false;$('booking-next-step').textContent='We’ll recheck your dates before opening WhatsApp. Tap Send there to share your enquiry.';track('available_result');return true}
  verified='';$('continue-booking').hidden=true;$('availability').textContent='Unavailable for your full selected period. Looking for alternatives…';track('unavailable_result');
  let alternatives;try{alternatives=await requestAvailability({...payload(),action:'alternatives'})}catch{if(signature===selectedPeriod())$('availability').textContent='Unavailable for your selected period. Alternative dates could not be loaded; try another date or retry.';return false}if(signature!==selectedPeriod())return false;
  $('availability').textContent='Unavailable for your selected period.';for(const option of alternatives.alternatives||[])suggest('Alternative dates · same duration',option.start,duration());
  if(ready){const t=stamp($('start').value,$('time').value),end=Math.max(0,...windows.filter(w=>w[0]<=t).map(w=>w[1])),short=Math.floor((end-t)/DAY);if(short>=1&&short<duration())suggest('A shorter rental may fit · recheck required',t,short)}
  if(!$('alternatives').children.length)$('alternatives').append(create('p','footnote','No alternatives found in the next 30 days. Try another month or contact us.'));return false;
 }catch{if(signature===selectedPeriod()){$('availability').className='';$('availability').textContent='Unable to check availability. Please retry or ask our team.';showManual()}return false}
 finally{checking=false;$('check').disabled=false;updateSticky()}
}
function saveDraft(){try{sessionStorage.setItem('epic-booking',JSON.stringify(Object.fromEntries(['start','time','days','custom','controllers','delivery','location'].map(id=>[id,$(id).value]).concat([['soundbar',$('sbar-addon').checked],['desiredControllers',desiredControllers]]))))}catch{}}
function restoreDraft(){try{const data=JSON.parse(sessionStorage.getItem('epic-booking')||'null');if(data&&data.start>=today){for(const id of ['start','time','days','custom','controllers','delivery','location'])if(data[id]!==undefined)$(id).value=data[id];$('sbar-addon').checked=data.soundbar===true;$('custom-days').hidden=$('days').value!=='custom';month=$('start').value.slice(0,7);desiredControllers=Number.isInteger(data.desiredControllers)?data.desiredControllers:null}}catch{}}
function updateSticky(){const bar=$('mobile-booking');if(!bar)return;const q=quote(),t=stamp($('start').value,$('time').value);$('mobile-price').textContent=q.custom?'Choose your rental':money(q.total)+(q.deliveryUnknown?' + delivery':'');$('mobile-dates').textContent=Number.isFinite(t)?fmt(t)+' · '+duration()+' day'+(duration()>1?'s':''):'Select dates for an estimate';$('mobile-action').textContent=checking?'Checking…':verified===selectedPeriod()?'Continue on WhatsApp':'Check availability';$('mobile-action').disabled=checking}
function initBooking(){
 fillTimes();restoreDraft();syncControllers();draw();renderEstimate();
 $('prev').onclick=()=>changeMonth(-1);$('next').onclick=()=>changeMonth(1);$('retry').onclick=()=>load();
 function changeMonth(delta){const next=nextMonth(month,delta);if(next<today.slice(0,7)||stamp(next+'-01')>Date.now()+366*DAY)return;month=next;load()}
 $('start').onchange=()=>datesChanged(true);$('time').onchange=()=>datesChanged();$('days').onchange=()=>{$('custom-days').hidden=$('days').value!=='custom';$('custom').required=$('days').value==='custom';datesChanged()};$('custom').oninput=()=>datesChanged();
 $('controllers').onchange=()=>{desiredControllers=Number($('controllers').value)||null;syncControllers();result();load()};
 $('sbar-addon').onchange=()=>{result();load()};$('delivery').onchange=()=>{document.querySelectorAll('[name=delivery-choice]').forEach(n=>n.checked=n.value===$('delivery').value);result()};$('location').oninput=saveDraft;
 document.querySelectorAll('[name=delivery-choice]').forEach(n=>n.onchange=()=>{$('delivery').value=n.value;$('delivery').dispatchEvent(new Event('change'))});
 $('check').onclick=checkExact;
 $('enquire').onsubmit=async e=>{e.preventDefault();if(!validateBooking(true))return;const manual=$('controllers').value==='More than 4'||!ready;if(!manual&&!await checkExact())return;saveDraft();const q=quote(),t=stamp($('start').value,$('time').value);const text=['Hi Epic Rentals! Please confirm my PS5 rental.','Pickup: '+fmt(t),'Return: '+fmt(t+duration()*DAY),'Duration: '+duration()+' days','Controllers: '+$('controllers').value,'Soundbar add-on: '+($('sbar-addon').checked?'Yes':'No'),'Transport: '+$('delivery').selectedOptions[0].text,'Location: '+$('location').value,q.custom?'Custom quote requested':(q.deliveryUnknown?'Rental subtotal: ':'Estimated total: ')+money(q.total)+(q.deliveryUnknown?' · delivery additional, please quote':''),...(q.custom?[]:['Included controllers: '+q.included,'Extra controller charges: '+money(q.extraTotal),'Estimated 50% advance: '+money(Math.ceil(q.total/2)),'Estimated balance on receipt: '+money(q.total-Math.ceil(q.total/2))]),manual?'Availability needs confirmation.':'Availability checked just now. Please confirm the booking and advance details.'].join('\n');track('whatsapp_click');window.location.href='https://wa.me/919444659236?text='+encodeURIComponent(text)};
 $('mobile-action').onclick=()=>{if(verified===selectedPeriod())$('enquire').requestSubmit();else checkExact()};
 const visibleSections=new Set();const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visibleSections.add(e.target);else visibleSections.delete(e.target)}$('mobile-booking').hidden=!visibleSections.size||$('ps5-panel').hidden},{threshold:0});observer.observe($('enquire'));observer.observe(document.querySelector('.calendar-panel'));
 const keyboard=()=>{const viewport=window.visualViewport;document.body.classList.toggle('keyboard-open',!!viewport&&window.innerHeight-viewport.height>150)};window.visualViewport?.addEventListener('resize',keyboard);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true,true)});
 window.addEventListener('pageshow',e=>{if(e.persisted)load(true,true)});
 setInterval(()=>{if(document.hidden||$('ps5-panel').hidden||checking)return;const r=document.querySelector('.calendar-panel').getBoundingClientRect();if(r.bottom>0&&r.top<window.innerHeight)load(true,true)},30000);
 load();if(month!==today.slice(0,7)){fetchMonth(today.slice(0,7),filterKey()).catch(()=>{});fetchMonth(nextMonth(today.slice(0,7)),filterKey()).catch(()=>{})}
}
