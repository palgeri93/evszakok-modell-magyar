export const DEG=Math.PI/180, TILT=23.44, YEAR=2026, DAYS=365;
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const mod=(x,n)=>((x%n)+n)%n;
export const epoch=Date.UTC(YEAR,0,1);
export function dateAt(day){return new Date(epoch+day*86400000)}
// Apparent geocentric solar longitude; Julian centuries from J2000.
// NOAA Solar Calculator equations, with a fixed educational obliquity of 23.44°.
export function solarLongitude(day){
 const jd=dateAt(day).getTime()/86400000+2440587.5,t=(jd-2451545)/36525;
 const l=mod(280.46646+t*(36000.76983+.0003032*t),360);
 const m=(357.52911+t*(35999.05029-.0001537*t))*DEG;
 const c=Math.sin(m)*(1.914602-t*(.004817+.000014*t))+Math.sin(2*m)*(.019993-.000101*t)+Math.sin(3*m)*.000289;
 return mod(l+c-.00569-.00478*Math.sin((125.04-1934.136*t)*DEG),360)*DEG;
}
export function declination(day){return Math.asin(Math.sin(TILT*DEG)*Math.sin(solarLongitude(day)))/DEG}
// Geometric horizon: centre of the Sun at altitude 0°, without atmospheric refraction.
// a+b cos(H)=0. The polar branches are handled before acos, including the poles.
export function daylight(latitude,declinationDegrees){
 const p=latitude*DEG,d=declinationDegrees*DEG,a=Math.sin(p)*Math.sin(d),b=Math.cos(p)*Math.cos(d);
 if(Math.abs(b)<1e-12)return Math.abs(a)<1e-12?12:(a>0?24:0);
 const x=-a/b;
 if(x<=-1+1e-12)return 24;
 if(x>=1-1e-12)return 0;
 return 24*Math.acos(x)/Math.PI;
}
export function sunHeight(latitude,longitude,declinationDegrees){
 const p=latitude*DEG,h=longitude*DEG,d=declinationDegrees*DEG;
 return Math.asin(clamp(Math.sin(p)*Math.sin(d)+Math.cos(p)*Math.cos(d)*Math.cos(h),-1,1))/DEG;
}
export function seasonDay(targetDegrees,lo,hi){
 for(let i=0;i<50;i++){
  const mid=(lo+hi)/2,diff=mod(solarLongitude(mid)/DEG-targetDegrees+180,360)-180;
  if(diff>0)hi=mid;else lo=mid;
 }return (lo+hi)/2;
}
export const seasons=[
 {name:'Tavaszi napéjegyenlőség',short:'Tavasz',day:seasonDay(0,65,90)},
 {name:'Nyári napforduló',short:'Nyár',day:seasonDay(90,160,185)},
 {name:'Őszi napéjegyenlőség',short:'Ősz',day:seasonDay(180,250,280)},
 {name:'Téli napforduló',short:'Tél',day:seasonDay(270,340,364)}
];
export function hourText(hours){
 const minutes=Math.round(hours*60);return `${Math.floor(minutes/60)} óra ${String(minutes%60).padStart(2,'0')} perc`;
}
