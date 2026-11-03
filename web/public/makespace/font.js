import {parse} from './vendor/opentype.js';
let fontPromise;
export async function textSupport(extra='',load=async()=>{
 const response=await fetch(new URL('./vendor/Abel-Regular.ttf',import.meta.url));
 if(!response.ok)throw Error('The lettering font could not load. Reload and try again.');
 return response.arrayBuffer();
}) {
 fontPromise ||= load().then(bytes=>parse(bytes));
 const font=await fontPromise, factor=1000/font.unitsPerEm;
 const chars=[...new Set([...Array.from({length:95},(_,i)=>String.fromCharCode(i+32)),...extra].filter(c=>c!=='\n'&&c!=='\r'))].slice(0,400);
 const glyphs=[];
 for(const char of chars){
  const glyph=font.charToGlyph(char), commands=glyph.path.commands;
  const contours=[];let contour=[],x=0,y=0;
  const add=(px,py)=>{contour.push([Math.round(px*factor*100)/100,Math.round(py*factor*100)/100]);x=px;y=py;};
  for(const command of commands){
   if(command.type==='M'){if(contour.length>2)contours.push(contour);contour=[];add(command.x,command.y);}
   if(command.type==='L')add(command.x,command.y);
   if(command.type==='Q'){const sx=x,sy=y;for(let i=1;i<=8;i++){const t=i/8,u=1-t;add(u*u*sx+2*u*t*command.x1+t*t*command.x,u*u*sy+2*u*t*command.y1+t*t*command.y);}}
   if(command.type==='C'){const sx=x,sy=y;for(let i=1;i<=10;i++){const t=i/10,u=1-t;add(u*u*u*sx+3*u*u*t*command.x1+3*u*t*t*command.x2+t*t*t*command.x,u*u*u*sy+3*u*u*t*command.y1+3*u*t*t*command.y2+t*t*t*command.y);}}
   if(command.type==='Z'){if(contour.length>2)contours.push(contour);contour=[];}
  }
  if(contour.length>2)contours.push(contour);
  const points=[],paths=[];
  for(let path of contours){path=path.filter((p,i)=>!i||p[0]!==path[i-1][0]||p[1]!==path[i-1][1]);if(path.length>2){paths.push(path.map((_,i)=>i+points.length));points.push(...path);}}
  glyphs.push({char,value:`[${Math.round(glyph.advanceWidth*factor)},${JSON.stringify(points)},${JSON.stringify(paths)}]`});
 }
 const lookup=glyphs.map(g=>`ord(c)==${g.char.codePointAt(0)}?${g.value}:`).join('');
 return `// MakeSpace lettering: Abel, Copyright MADType, SIL Open Font License 1.1.\n// Outlines avoid platform-specific font installation. Font choice uses Abel.\nfunction _ms_glyph(c)=${lookup}[500,[],[]];\nfunction _ms_width(s,spacing,i=0)=i>=len(s)?0:_ms_glyph(s[i])[0]*spacing+_ms_width(s,spacing,i+1);\nmodule text(text="",size=10,font="",halign="left",valign="baseline",spacing=1,direction="ltr",language="en",script="latin"){\n s=str(text); w=_ms_width(s,spacing);\n hx=halign=="center"?-w/2:halign=="right"?-w:0;\n vy=valign=="center"?-350:valign=="top"?-700:valign=="bottom"?180:0;\n scale([size/1000,size/1000]) translate([hx,vy]) for(i=[0:len(s)-1]) if(len(s)>0) let(g=_ms_glyph(s[i]),x=i==0?0:_ms_width(substr_ms(s,0,i),spacing)) if(len(g[1])>2) translate([x,0]) polygon(points=g[1],paths=g[2]);\n}\nfunction substr_ms(s,start,count)=count<=0?"":str(s[start],substr_ms(s,start+1,count-1));\n`;
}
