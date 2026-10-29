import assert from 'node:assert/strict';
import {daylight,declination,seasons,solarLongitude,DEG,sunHeight,dateAt} from '../solar.mjs';
const close=(actual,expected,tol=1e-7)=>assert.ok(Math.abs(actual-expected)<tol,`${actual} != ${expected}`);
for(const s of seasons)console.log(s.name,dateAt(s.day).toISOString(),declination(s.day));
close(declination(seasons[0].day),0);close(declination(seasons[1].day),23.44);close(declination(seasons[2].day),0);close(declination(seasons[3].day),-23.44);
close(daylight(69.65,23.44),24);close(daylight(69.65,-23.44),0);close(daylight(-69.65,23.44),0);close(daylight(-69.65,-23.44),24);
close(daylight(66.56,23.44),24);close(daylight(66.56,-23.44),0);
for(const dec of [-23.44,0,23.44])close(daylight(0,dec),12);
for(const lat of [-89,-70,-47.5,0,47.5,70,89])close(daylight(lat,0),12);
close(daylight(90,23.44),24);close(daylight(90,-23.44),0);close(daylight(-90,23.44),0);close(daylight(-90,-23.44),24);
// Independent numerical integration of the surface-normal dot light direction.
// This is also the sign test used by the fragment shader for the lit hemisphere.
for(const lat of [-89,-80,-69.65,-66.56,-47.5,0,47.5,66.56,69.65,80,89])for(const dec of [-23.44,-12,0,12,23.44]){
 let lit=0,N=36000;
 for(let j=0;j<N;j++){
  const phi=lat*DEG,longitude=(j+.5)*2*Math.PI/N;
  const nx=Math.cos(phi)*Math.cos(longitude),ny=Math.sin(phi);
  if(nx*Math.cos(dec*DEG)+ny*Math.sin(dec*DEG)>0)lit++;
 }
 close(daylight(lat,dec),24*lit/N,.0014);close(daylight(lat,dec)+daylight(-lat,dec),24,.00001);
}
// The polar plateau must extend beyond the single date of the solstice.
for(const offset of [-20,-10,0,10,20])close(daylight(80,declination(seasons[1].day+offset)),24);
for(let d=0;d<365;d+=.5)for(const lat of [-90,-89,0,69.65,90]){const h=daylight(lat,declination(d));assert.ok(Number.isFinite(h)&&h>=0&&h<=24)}
console.log('PASS: solstices, equinoxes, both hemispheres, poles, polar plateaus, independent illumination integration.');
