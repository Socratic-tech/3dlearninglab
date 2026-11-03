import {createOpenSCAD} from './vendor/openscad.js';
import {definitions,validateValues} from './parameters.js';
import {mountBundledLibraries,writeProjectFile,buildProblem} from './libraries.js';
import {textSupport} from './font.js';
import {safePath} from './archive.js';
export async function compileProject(data,{loadLibrary,loadFont}={}){
 const messages=[];
 try{
  const issues=validateValues(data.code,data.values,data.templateId);if(issues.length)return{error:issues.join('\n'),problem:{kind:'settings',title:'One setting needs a little attention.',detail:issues[0]},messages};
  const record=t=>{if(!/Could not initialize localization/.test(t))messages.push(t);};
  const app=await createOpenSCAD({noInitialRun:true,print:record,printErr:record});const engine=app.getInstance();
  messages.push(...await mountBundledLibraries(engine,data.code,data.files,loadLibrary));
  for(const file of data.files||[])writeProjectFile(engine,file.name,new Uint8Array(file.bytes));
  const shim=await textSupport(data.code+JSON.stringify(data.values||{}),loadFont);
  const entry=safePath(data.entryPath||'main.scad');writeProjectFile(engine,entry,data.code+'\n'+shim);
  const status=engine.callMain(['/'+entry,'-o','/__makespace_result.stl',...definitions(data.values||{})]);
  if(status!==0||messages.some(t=>/ERROR:|Can't open (?:include|library) file|Current top level object is empty|Ignoring unknown (?:module|function)/i.test(t)))throw Error(messages.join('\n'));
  const bytes=engine.FS.readFile('/__makespace_result.stl');if(!bytes.length)throw Error('This design has no 3D shape to download.');return{bytes,messages};
 }catch(error){const detail=String(error.message||error);return{error:detail,messages,problem:buildProblem([...messages,detail],data.code)};}
}
