import {DEG,clamp} from './solar.mjs';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const TAU=Math.PI*2;
export class Globe {
 constructor(stage,canvas,overlay){
  this.stage=stage;this.canvas=canvas;this.overlay=overlay;this.ctx=overlay.getContext('2d');
  this.yaw=0;this.elevation=10*DEG;this.zoom=1;this.spin=Math.PI/2;this.options={grid:true,polar:true,axis:true};this.lat=69.65;this.dec=23.44;
  this.gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false});
  if(!this.gl)throw Error('Ehhez a részletes földgömbhöz WebGL 2 támogatás szükséges. Engedélyezd a böngésző hardveres gyorsítását, vagy használj friss böngészőt.');
  this.initGL();new ResizeObserver(()=>this.draw()).observe(stage);
  const pointers=new Map();let previousDistance=0;
  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);previousDistance=0;});
  stage.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId))return;
   const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
   if(pointers.size===1){this.yaw-=(e.clientX-old[0])*.007;this.elevation=clamp(this.elevation+(e.clientY-old[1])*.007,-Math.PI/2,Math.PI/2)}
   else{const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(previousDistance)this.zoom=clamp(this.zoom*distance/previousDistance,.65,1.35);previousDistance=distance}
   this.draw();this.onViewChange?.();
  });
  const release=e=>{pointers.delete(e.pointerId);previousDistance=0};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  stage.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*.001),.65,1.35);this.draw()},{passive:false});
 }
 initGL(){
  const gl=this.gl;
  const vs=`#version 300 es
  const vec2 p[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
  void main(){gl_Position=vec4(p[gl_VertexID],0.,1.);}`;
  const fs=`#version 300 es
  precision highp float;
  uniform vec2 center;uniform float radius;uniform vec3 rightVector,upVector,viewVector,sun;uniform float spin;uniform sampler2D mapTexture;out vec4 color;
  void main(){
   vec2 q=(gl_FragCoord.xy-center)/radius;float r2=dot(q,q);if(r2>1.)discard;
   float z=sqrt(max(0.,1.-r2));vec3 n=normalize(q.x*rightVector+q.y*upVector+z*viewVector);
   // East-positive map longitude: looking at Greenwich, east must be on the right.
   // Reverse the texture coordinate, not the rotation phase or camera motion.
   float u=fract((spin-atan(n.z,n.x))/6.28318530718+.5);float v=.5-asin(clamp(n.y,-1.,1.))/3.14159265359;
   vec3 surface=texture(mapTexture,vec2(u,v)).rgb;
   float cosine=dot(n,sun),daylight=smoothstep(-.004,.004,cosine);
   vec3 lit=surface*(.64+.36*sqrt(max(0.,cosine)));
   vec3 dark=surface*vec3(.12,.17,.26);
   vec3 earth=mix(dark,lit,daylight)+vec3(.025,.06,.085)*pow(1.-z,4.);
   float alpha=1.-smoothstep(1.-1.6*fwidth(r2),1.,r2);color=vec4(earth,alpha);
  }`;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
  this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([130,181,204,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 }
 async loadMap(){
  const res=await fetch('assets/land.geojson');if(!res.ok)throw Error('A partvonalak nem tölthetők be.');const data=await res.json();
  const map=document.createElement('canvas');map.width=4096;map.height=2048;const ctx=map.getContext('2d');ctx.fillStyle='#83b4cc';ctx.fillRect(0,0,map.width,map.height);ctx.fillStyle='#b6c698';ctx.strokeStyle='#829c75';ctx.lineWidth=1;
  const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
  for(const feature of data.features)for(const polygon of polygons(feature.geometry)){
   ctx.beginPath();for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*map.width,y=(90-lat)/180*map.height;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.closePath()}ctx.fill('evenodd');ctx.stroke();
  }
  const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,map);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);this.mapReady=true;this.draw();
 }
 view(name){this.yaw=0;this.elevation=name==='north'?75*DEG:name==='south'?-75*DEG:10*DEG;this.zoom=1;this.draw()}
 update({lat=this.lat,dec=this.dec,spin=this.spin,options=this.options}={}){Object.assign(this,{lat,dec,spin,options});this.draw()}
 draw(){
  const rect=this.stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  for(const canvas of [this.canvas,this.overlay])if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  this.width=rect.width;this.height=rect.height;this.radius=Math.min(this.width,this.height)*.365*this.zoom;this.cx=this.width*.48;this.cy=this.height*.5;
  const a=this.yaw,e=this.elevation;this.right=[Math.cos(a),0,-Math.sin(a)];this.up=[-Math.sin(a)*Math.sin(e),Math.cos(e),-Math.cos(a)*Math.sin(e)];this.viewVector=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];this.sun=[Math.cos(this.dec*DEG),Math.sin(this.dec*DEG),0];
  const gl=this.gl,p=this.program;gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(p);
  const u=name=>gl.getUniformLocation(p,name);
  gl.uniform2f(u('center'),this.cx*dpr,h-this.cy*dpr);gl.uniform1f(u('radius'),this.radius*dpr);for(const [name,v] of [['rightVector',this.right],['upVector',this.up],['viewVector',this.viewVector],['sun',this.sun]])gl.uniform3fv(u(name),v);
  gl.uniform1f(u('spin'),this.spin);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(u('mapTexture'),0);gl.drawArrays(gl.TRIANGLES,0,3);
  const c=this.ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,this.width,this.height);this.drawOverlay(c);
 }
 project(n){return [this.cx+this.radius*dot(n,this.right),this.cy-this.radius*dot(n,this.up),dot(n,this.viewVector)]}
 curve(c,fn,color,width=1,dash=[],dayColor=null){
  let prev=null;for(let i=0;i<=360;i++){
   const n=fn(i/360*TAU),p=this.project(n);
   if(prev&&p[2]>.001&&prev.p[2]>.001){c.beginPath();c.lineWidth=width;c.strokeStyle=dayColor?(dot(n,this.sun)>0?dayColor:color):color;c.setLineDash(dash);c.moveTo(prev.p[0],prev.p[1]);c.lineTo(p[0],p[1]);c.stroke()}prev={p,n};
  }c.setLineDash([]);
 }
 parallel(c,lat,color,width=1,dash=[],dayColor=null){const p=lat*DEG;this.curve(c,t=>[Math.cos(p)*Math.cos(t),Math.sin(p),Math.cos(p)*Math.sin(t)],color,width,dash,dayColor)}
 drawOverlay(c){
  c.save();c.beginPath();c.arc(this.cx,this.cy,this.radius,0,TAU);c.clip();
  if(this.options.grid){
   for(const lat of [-60,-30,0,30,60])this.parallel(c,lat,'#ffffff35',lat===0?1.1:.6);
   for(let lon=0;lon<360;lon+=30){const a=this.spin-lon*DEG;this.curve(c,t=>[Math.cos(t)*Math.cos(a),Math.sin(t),Math.cos(t)*Math.sin(a)],'#ffffff30',.6)}
  }
  if(this.options.polar)for(const lat of [-66.56,66.56])this.parallel(c,lat,'#e0e7f2bb',1.3,[4,4]);
  if(Math.abs(this.lat)<89.99)this.parallel(c,this.lat,'#bb86e8',2.8,[],'#ffce60');
  else{const p=this.project([0,Math.sign(this.lat),0]);if(p[2]>0){c.beginPath();c.arc(p[0],p[1],5,0,TAU);c.fillStyle=dot([0,Math.sign(this.lat),0],this.sun)>0?'#ffce60':'#bb86e8';c.fill()}}
  c.restore();
  if(this.options.axis){
   const n=this.project([0,1.21,0]),s=this.project([0,-1.21,0]),np=this.project([0,1,0]),sp=this.project([0,-1,0]);c.strokeStyle='#56758c';c.lineWidth=1.5;
   for(const [a,b] of [[np,n],[sp,s]])if(a[2]>-.2){c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
   c.fillStyle='#385568';c.font='600 12px system-ui';c.textAlign='center';if(Math.hypot(n[0]-s[0],n[1]-s[1])>50){if(np[2]>-.2)c.fillText('Északi pólus',n[0],Math.max(17,n[1]-7));if(sp[2]>-.2)c.fillText('Déli pólus',s[0],Math.min(this.height-36,s[1]+17))}
  }
  // Sun rays use the same projected light vector as the physical illumination.
  let sx=dot(this.sun,this.right),sy=-dot(this.sun,this.up),len=Math.hypot(sx,sy);if(len>.2){sx/=len;sy/=len;
   const anchor=[this.cx+sx*this.radius*1.43,this.cy+sy*this.radius*1.43];
   c.strokeStyle='#d89e2e';c.fillStyle='#b17c18';c.lineWidth=1.5;
   for(const shift of [-14,0,14]){const x=anchor[0]-sy*shift,y=anchor[1]+sx*shift;c.beginPath();c.moveTo(x,y);c.lineTo(x-sx*30,y-sy*30);c.stroke();c.beginPath();c.moveTo(x-sx*30,y-sy*30);c.lineTo(x-sx*24-sy*3,y-sy*24+sx*3);c.lineTo(x-sx*24+sy*3,y-sy*24-sx*3);c.fill()}
   c.font='11px system-ui';c.textAlign='center';c.fillText('Napsugarak',clamp(anchor[0],45,this.width-45),clamp(anchor[1]-24,18,this.height-28));
  }
 }
}
