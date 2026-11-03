import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {STLLoader} from './vendor/STLLoader.js';
export function inspectSTL(bytes){
 const array=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const geometry=new STLLoader().parse(array.buffer.slice(array.byteOffset,array.byteOffset+array.byteLength));
 const p=geometry.attributes.position;if(!p?.count||p.count<3)throw Error('This file has no 3D shape.');geometry.computeBoundingBox();const size=new THREE.Vector3();geometry.boundingBox.getSize(size);if(!size.toArray().every(Number.isFinite))throw Error('This model has invalid dimensions.');
 let volume=0;const edges=p.count<=300000?new Map():null;
 const point=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e5)).join(',');
 for(let i=0;i<p.count;i+=3){const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i),bx=p.getX(i+1),by=p.getY(i+1),bz=p.getZ(i+1),cx=p.getX(i+2),cy=p.getY(i+2),cz=p.getZ(i+2);volume+=(ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx))/6;if(edges)for(const[a,b]of[[i,i+1],[i+1,i+2],[i+2,i]]){const k=[point(a),point(b)].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
 return{geometry,size,triangles:p.count/3,volume:Math.abs(volume)/1000,closed:edges?[...edges.values()].every(v=>v===2):null};
}
export class ModelViewer{
 constructor(element){this.element=element;this.color='#8270d8';this.size=new THREE.Vector3(60,35,45);this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#f0f3ed');this.camera=new THREE.PerspectiveCamera(35,1,.1,10000);
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{element.textContent='This browser cannot show 3D graphics. You can still build and download an STL.';return;}
  const r=this.renderer;r.setPixelRatio(Math.min(devicePixelRatio,2));r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFShadowMap;element.append(r.domElement);r.domElement.setAttribute('aria-label','Drag to rotate the model. Scroll or pinch to zoom.');
  this.orbit=new OrbitControls(this.camera,r.domElement);this.orbit.enableDamping=true;this.orbit.maxPolarAngle=Math.PI*.495;this.orbit.minDistance=3;this.orbit.maxDistance=5000;
  this.scene.add(new THREE.HemisphereLight(0xffffff,0xc1cabd,2.5));const light=new THREE.DirectionalLight(0xffffff,3.4);light.position.set(120,200,100);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-250;light.shadow.camera.right=250;light.shadow.camera.top=250;light.shadow.camera.bottom=-250;light.shadow.normalBias=.1;this.scene.add(light);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.ShadowMaterial({opacity:.1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.15;ground.receiveShadow=true;this.scene.add(ground);this.grid=new THREE.GridHelper(500,50,0xbecbb6,0xdbe3d5);this.grid.position.y=-.1;this.scene.add(this.grid);this.fit();
  new ResizeObserver(()=>{const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();r.setSize(w,h);}).observe(element);r.setAnimationLoop(()=>{this.orbit.update();r.render(this.scene,this.camera);});
 }
 clear(){if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh=null;}}
 show(info,preserve=false){this.clear();const g=info.geometry;const center=new THREE.Vector3();g.boundingBox.getCenter(center);g.translate(-center.x,-center.y,-g.boundingBox.min.z);g.rotateX(-Math.PI/2);g.computeVertexNormals();this.size.set(info.size.x,info.size.z,info.size.y);this.mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:this.color,roughness:.5,metalness:.025}));this.mesh.castShadow=true;this.mesh.receiveShadow=true;this.scene.add(this.mesh);if(!preserve)this.fit();}
 fit(top=false){if(!this.orbit)return;const max=Math.max(...this.size.toArray(),20),aspect=this.camera.aspect;const distance=Math.max(this.size.x/Math.max(aspect,.4),this.size.y,this.size.z*.8,20)*1.1;this.orbit.target.set(0,this.size.y*.4,0);this.camera.position.copy(this.orbit.target).add(new THREE.Vector3(top?0:1.25,top?2.8:1.05,top?.01:1.7).multiplyScalar(distance));this.camera.near=Math.max(.01,max/1000);this.camera.far=Math.max(10000,max*40);this.camera.updateProjectionMatrix();this.orbit.update();}
 setColor(color){this.color=color;this.mesh?.material.color.set(color);}
 zoom(factor){if(this.orbit){this.camera.position.sub(this.orbit.target).multiplyScalar(factor).add(this.orbit.target);this.orbit.update();}}
 image(){this.renderer?.render(this.scene,this.camera);return this.renderer?.domElement.toDataURL('image/png');}
}
