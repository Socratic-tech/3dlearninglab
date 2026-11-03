import {zipSync,unzipSync,strToU8,strFromU8} from './vendor/fflate.js';
import {applyValues} from './parameters.js';
import {normalizeProject} from './storage.js';
export const MAX_BYTES=40e6;
export function safePath(name){const path=name.replace(/\\/g,'/');if(!path||path.startsWith('/')||/^[A-Za-z]:/.test(path)||path.split('/').some(p=>!p||p==='.'||p==='..')||path==='__makespace_result.stl')throw Error('The archive contains an unsafe or reserved file path.');return path;}
export function unpack(bytes){
 if(bytes.byteLength>MAX_BYTES)throw Error('Keep the ZIP smaller than 40 MB.');
 let total=0,count=0;
 const entries=unzipSync(new Uint8Array(bytes),{filter:file=>{if(file.name.endsWith('/'))return false;safePath(file.name);total+=file.originalSize;count++;if(total>MAX_BYTES||count>400)throw Error('This ZIP expands beyond the project limit (40 MB or 400 files).');return !file.name.includes('__MACOSX/')&&!file.name.endsWith('.DS_Store');}});
 const paths=Object.keys(entries);if(!paths.length)throw Error('The ZIP has no project files.');
 const prefix=paths[0].includes('/')?paths[0].split('/')[0]+'/':'';
 return Object.fromEntries(paths.map(p=>[prefix&&paths.every(n=>n.startsWith(prefix))?p.slice(prefix.length):p,entries[p]]));
}
export function readArchive(bytes){
 const entries=unpack(bytes);
 if(entries['makespace.json']){
  let manifest;try{manifest=JSON.parse(strFromU8(entries['makespace.json']));}catch{throw Error('The MakeSpace project information is damaged.');}
  if(manifest.format!=='makespace/v1')throw Error('This project was made with a different MakeSpace format.');
  const doc=normalizeProject(manifest.project);safePath(doc.entryPath);
  doc.files=Object.entries(entries).filter(([name])=>name!==doc.entryPath&&!['makespace.json','README.txt','preview.stl'].includes(name)&&/\.(scad|stl|svg|ttf|otf)$/i.test(name)).map(([name,bytes])=>({name,bytes}));
  return{document:doc,entries};
 }
 const candidates=Object.keys(entries).filter(n=>/\.scad$/i.test(n)).sort((a,b)=>a.split('/').length-b.split('/').length||a.localeCompare(b));
 if(!candidates.length)throw Error('This ZIP has no .scad files.');
 return{entries,candidates};
}
export function projectFromEntry(entries,entry){
 safePath(entry);if(!entries[entry])throw Error('Choose the main .scad file.');
 const document=normalizeProject({title:entry.split('/').at(-1).replace(/\.scad$/i,''),code:strFromU8(entries[entry]),entryPath:entry});
 document.files=Object.entries(entries).filter(([name])=>name!==entry&&/\.(scad|stl|svg|ttf|otf)$/i.test(name)).map(([name,bytes])=>({name,bytes}));return document;
}
export async function projectArchive(doc,{textCode='',library=null,stl=null,loadText=async path=>{const r=await fetch(new URL(path,import.meta.url));if(!r.ok)throw Error('Could not load the project license.');return r.text();}}={}){
 const entry=safePath(doc.entryPath||'main.scad');const output={};
 for(const file of doc.files||[])output[safePath(file.name)]=new Uint8Array(file.bytes);
 if(library)for(const file of library.files)if(!output[file.name])output[file.name]=strToU8(file.content);
 const source=applyValues(doc.code,doc.values);
 output[entry]=strToU8(source+(textCode?'\n'+textCode:''));
 output['makespace.json']=strToU8(JSON.stringify({format:'makespace/v1',project:{...doc,files:undefined}},null,2));
 if(library)output['PUZZLECAD-LICENSE-MIT.txt']=strToU8(await loadText('./libraries/PUZZLECAD-LICENSE-MIT.txt'));
 if(textCode)output['ABEL-OFL.txt']=strToU8(await loadText('./vendor/Abel-OFL.txt'));
 if(stl)output['preview.stl']=new Uint8Array(stl);
 output['README.txt']=strToU8('MakeSpace 1.0 project\nOpen this ZIP in MakeSpace to keep your settings, files, and notebook.\nThe main SCAD file also contains the selected parameter values.\nSTL files contain geometry only; preview colors are not printing colors.\nPuzzleCAD library files, if included, are MIT licensed by Aaron Siegel.\nLettering uses Abel outlines (SIL OFL). Included licenses apply.\n');
 return zipSync(output,{level:6});
}
export function notebookMarkdown(doc){const n=doc.notebook;return`# ${doc.title}\n\n## My design goal\n${n.goal||'Not recorded yet.'}\n\n## My prediction\n${n.prediction||'Not recorded yet.'}\n\n${n.trials.map((t,i)=>`## Trial ${i+1}\nSettings: ${JSON.stringify(t.settings)}\n\nPrediction: ${t.prediction||'Not recorded.'}\n\nResult: ${t.result||'Not recorded yet.'}\n`).join('\n')}\n## What I learned / my next change\n${n.reflection||'Not recorded yet.'}\n`;}
