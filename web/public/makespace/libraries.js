import {safePath} from './archive.js';
export function writeProjectFile(engine,name,bytes) {
 const path=safePath(name);
 let folder='';for(const part of path.split('/').slice(0,-1)){folder+='/'+part;try{engine.FS.mkdir(folder);}catch{}}
 engine.FS.writeFile('/'+path,bytes);
}
export async function mountBundledLibraries(engine,code,files=[],load=async()=>{
 const response=await fetch(new URL('./libraries/puzzlecad-2.2.json',import.meta.url));
 if(!response.ok)throw Error('The PuzzleCAD library could not load. Reload the page and try again.');
 return response.json();
}) {
 const sources=[code,...files.filter(f=>f.name.endsWith('.scad')).map(f=>new TextDecoder().decode(f.bytes))];
 if(!sources.some(s=>/\b(?:include|use)\s*<[^>]*puzzlecad(?:\/[^>]*)?\.scad\s*>/i.test(s)))return [];
 const library=await load();
 for(const file of library.files)writeProjectFile(engine,file.name,file.content);
 return [`PuzzleCAD ${library.version} loaded (${library.files.length} library files).`];
}
export function enableFirstTutorialExample(code) {
 if(!/interactive puzzlecad tutorial/i.test(code))return code;
 return code.replace(/^(\s*)\*(\s*burr_piece\s*\()/m,'$1$2');
}
export function buildProblem(messages,code) {
 const text=messages.join('\n');
 const missing=[...text.matchAll(/Can't open (?:include|library) file ['"]([^'"\n]+)['"]/gi)].map(m=>m[1]);
 if(missing.length)return {kind:'missing-library',title:'This project needs another file.',detail:`Missing: ${[...new Set(missing)].join(', ')}. Open Teacher tools → Add supporting files to add it.`};
 if(/Current top level object is empty|no 3D shape/i.test(text)) {
  if(enableFirstTutorialExample(code)!==code)return {kind:'tutorial-empty',title:'Choose a puzzle example to begin.',detail:'This tutorial starts with its examples switched off. Select “Show first example” to turn one on.'};
  return {kind:'empty',title:'There’s no 3D shape to show yet.',detail:'This file may only define reusable parts. Add a shape or call a module in Teacher tools, then update the project.'};
 }
 return {kind:'build-error',title:'Let’s adjust that.',detail:'The model could not build. Try Undo, check supporting files, or ask your teacher to look at Build details.'};
}
