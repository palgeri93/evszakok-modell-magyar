import {DEG,TILT,DAYS,epoch,clamp,mod,dateAt,solarLongitude,declination,daylight,seasons,hourText} from './solar.mjs';
import {Globe} from './globe.mjs';
const $=id=>document.getElementById(id);
const state={day:seasons[1].day,latitude:69.65,playing:false,spin:Math.PI/2};
const monthNames=['jan.','febr.','márc.','ápr.','máj.','jún.','júl.','aug.','szept.','okt.','nov.','dec.'];
const formatDate=d=>new Intl.DateTimeFormat('hu-HU',{month:'long',day:'numeric',timeZone:'UTC'}).format(dateAt(d));
const latText=lat=>Math.abs(lat)<.005?'0° · Egyenlítő':`${Math.abs(lat).toFixed(2).replace('.',',')}° ${lat>=0?'É':'D'}`;
let globe,yearPath='',lastLatitude=NaN,lastChartWidth=0,lastUpdate=performance.now();
const chartBounds={left:52,right:1080,top:16,bottom:173};
for(const [i,s] of seasons.entries()){
 const button=document.createElement('button');button.dataset.season=i;button.innerHTML=`${s.name}<small>${formatDate(s.day)}</small>`;button.onclick=()=>{pause();state.day=s.day;update()};document.querySelector('.seasons').appendChild(button);
}
function pause(){state.playing=false;updatePlay()}
function updatePlay(){$('play').textContent=state.playing?'Ⅱ Szünet':'▶ Lejátszás';$('play').setAttribute('aria-pressed',String(state.playing))}
function update(){
 const dec=declination(state.day),hours=daylight(state.latitude,dec);
 $('day').value=state.day;$('date').value=dateAt(state.day).toISOString().slice(0,10);$('dateText').textContent=formatDate(state.day);$('latitude').value=state.latitude;$('latitudeText').textContent=latText(state.latitude);
 $('declination').textContent=`Napdeklináció: ${dec.toFixed(2).replace('.',',')}°`;
 $('dayHours').textContent=hourText(hours);$('nightHours').textContent=hourText(24-hours);$('dayFill').style.width=hours/24*100+'%';$('dayFill').parentElement.setAttribute('aria-label',`Nappal ${hourText(hours)}, éjszaka ${hourText(24-hours)}`);
 const horizon=Math.abs(state.latitude)>89.999&&Math.abs(dec)<1e-8;
 $('polarStatus').textContent=horizon?'A Nap a horizonton jár':hours>=24-1e-8?'Sarki nappal':hours<=1e-8?'Sarki éjszaka':'Váltakozó nappal és éjszaka';
 $('explanation').textContent=horizon?'A napéjegyenlőség pillanatában a póluson a Nap középpontja a horizonton van. A kijelzett 12–12 óra itt csak határesetet jelöl.':hours>=24-1e-8?'Ezen a szélességen a Nap egész nap a horizont felett marad. A szélességi kör teljes egészében megvilágított.':hours<=1e-8?'Ezen a szélességen a Nap egész nap a horizont alatt marad. A szélességi kör teljes egészében az éjszakai félgömbön van.':'A szélességi kör egy része világos, másik része sötét. A forgás során ezért napkelte és napnyugta követi egymást.';
 for(const b of document.querySelectorAll('[data-lat]'))b.classList.toggle('selected',Math.abs(Number(b.dataset.lat)-state.latitude)<.005);
 for(const b of document.querySelectorAll('[data-season]')){const selected=Math.abs(state.day-seasons[Number(b.dataset.season)].day)<.01;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))}
 globe?.update({lat:state.latitude,dec,spin:state.spin});drawOrbit();drawChart();
 window.modelState={...state,declination:dec,daylight:hours};
}
function drawOrbit(){
 const svg=$('orbit'),angle=solarLongitude(state.day),cx=180,cy=85,rx=117,ry=48;
 const earth=a=>[cx+Math.sin(a)*rx,cy-Math.cos(a)*ry];
 const axis=(x,y,color,width=1)=>`<path d="M${x+6},${y+13}L${x-6},${y-13}" stroke="${color}" stroke-width="${width}"/>`;
 let out=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#ccd8df"/><circle cx="${cx}" cy="${cy}" r="15" fill="#f4bd4d"/><text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" fill="#5f4618">Nap</text>`;
 for(const s of seasons){const [x,y]=earth(solarLongitude(s.day));out+=`<circle cx="${x}" cy="${y}" r="7" fill="#e4eced"/>${axis(x,y,'#8b9fab')}<text x="${x}" y="${y+(s.short==='Tavasz'?-19:27)}" text-anchor="middle" font-size="10" fill="#607482">${s.short}</text>`}
 const [x,y]=earth(angle);out+=`<path d="M${cx},${cy}L${x},${y}" stroke="#edc979" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y}" r="10" fill="#258c9a" stroke="white" stroke-width="2"/>${axis(x,y,'#193347',2)}<text x="180" y="177" text-anchor="middle" font-size="10" fill="#607482">A tengely iránya keringés közben közel állandó</text>`;svg.innerHTML=out;
}
function drawChart(){
 const width=Math.max(330,Math.min(1100,Math.round($('chart').getBoundingClientRect().width)));
 $('chart').setAttribute('viewBox',`0 0 ${width} 220`);chartBounds.left=43;chartBounds.right=width-12;
 const {left,right,top,bottom}=chartBounds,x=d=>left+d/(DAYS-1)*(right-left),y=h=>bottom-h/24*(bottom-top);
 if(lastLatitude!==state.latitude||lastChartWidth!==width){yearPath='';for(let d=0;d<DAYS;d++)yearPath+=(d?'L':'M')+x(d).toFixed(2)+','+y(daylight(state.latitude,declination(d))).toFixed(2);lastLatitude=state.latitude;lastChartWidth=width}
 let out='';for(const h of [0,6,12,18,24])out+=`<path d="M${left},${y(h)}H${right}" stroke="#e3e9ec"/><text x="${left-10}" y="${y(h)+4}" text-anchor="end" font-size="11" fill="#607482">${h} óra</text>`;
 for(let m=0;m<12;m+=(width<500?2:1)){const d=(Date.UTC(2026,m,15,12)-epoch)/86400000;out+=`<text x="${x(d)}" y="${bottom+24}" text-anchor="middle" font-size="11" fill="#607482">${monthNames[m]}</text>`}
 out+=`<path d="${yearPath}L${right},${bottom}H${left}Z" fill="#f8df982e"/><path d="${yearPath}" fill="none" stroke="#17858a" stroke-width="2.5"/>`;
 const px=x(state.day),py=y(daylight(state.latitude,declination(state.day)));out+=`<path d="M${px},${top}V${bottom}" stroke="#b08020" stroke-dasharray="4 4"/><circle cx="${px}" cy="${py}" r="4.5" fill="#e3ab35" stroke="white" stroke-width="2"/>`;
 $('chart').innerHTML=out;$('chartLatitude').textContent=latText(state.latitude);
}
$('latitude').oninput=e=>{state.latitude=Number(e.target.value);update()};
for(const b of document.querySelectorAll('[data-lat]'))b.onclick=()=>{state.latitude=Number(b.dataset.lat);update()};
$('day').oninput=e=>{pause();state.day=Number(e.target.value);update()};
$('date').onchange=e=>{if(!e.target.value)return;const value=(new Date(e.target.value+'T12:00:00Z').getTime()-epoch)/86400000;if(!Number.isFinite(value))return;pause();state.day=clamp(value,0,DAYS-1);update()};
$('play').onclick=()=>{state.playing=!state.playing;lastUpdate=performance.now();updatePlay()};
$('reset').onclick=()=>{pause();Object.assign(state,{day:seasons[1].day,latitude:69.65,spin:Math.PI/2});globe?.view('side');for(const id of ['grid','polar','axis']){$(id).checked=true;if(globe)globe.options[id]=true}document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view==='side'));update()};
for(const id of ['grid','polar','axis'])$(id).onchange=e=>{if(globe){globe.options[id]=e.target.checked;globe.draw()}};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{globe?.view(b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b))};
$('chart').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*e.currentTarget.viewBox.baseVal.width;pause();state.day=clamp((x-chartBounds.left)/(chartBounds.right-chartBounds.left)*(DAYS-1),0,DAYS-1);update()};
$('helpButton').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();$('help').onclick=e=>{if(e.target===$('help'))$('help').close()};
$('fullscreen').onclick=async()=>{document.body.classList.toggle('expanded');$('fullscreen').textContent=document.body.classList.contains('expanded')?'Normál nézet':'Nagyítás';globe?.draw()};
try{
 globe=new Globe($('stage'),$('earth'),$('overlay'));globe.onViewChange=()=>document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('selected'));
 update();await globe.loadMap();window.simulatorReady=true;
}catch(e){$('renderError').hidden=false;$('renderError').textContent=e.message;console.error(e);update()}
new ResizeObserver(()=>drawChart()).observe($('chart'));
function frame(time){if(state.playing&&time-lastUpdate>45){const dt=Math.min((time-lastUpdate)/1000,.15);state.day=mod(state.day+dt*Number($('speed').value),DAYS);state.spin=mod(state.spin+dt*.9,Math.PI*2);update();lastUpdate=time}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.seasonModel={setDay(day){pause();state.day=clamp(day,0,364.999);update()},setLatitude(lat){state.latitude=clamp(lat,-90,90);update()},seasons,daylight,declination,getGlobe:()=>globe};
