import {projects,template} from './models.js';
import {parameters,settingsFor,validateValues,applyValues} from './parameters.js';
import {ModelViewer,inspectSTL} from './viewer.js';
import {newProject,normalizeProject,storeProject,getProject,listProjects} from './storage.js';
import {projectFromEntry,projectArchive,notebookMarkdown,safePath,MAX_BYTES} from './archive.js';
import {textSupport} from './font.js';
import {buildProblem,enableFirstTutorialExample} from './libraries.js';
import {createPatternEditor,patternRows,encodePattern} from './pattern.js';
const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
let doc,undo=[],redo=[],worker,buildTimer,buildTimeout,revision=0,stl=null,currentInfo=null,shownDocument=null,saveQueue=Promise.resolve(),saveSerial=0,saveTimer,toastTimer,editGroup='',editTime=0,pendingZip,nameAction,shelfRecords=[];
const viewer=new ModelViewer($('viewport'));
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function status(title,detail,error=false){$('status-title').textContent=title;$('status-detail').textContent=detail;$('status').classList.toggle('error',error);$('status').querySelector('.status-icon').textContent=error?'!':'✓';}
function cleanName(name){return(name||'My project').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'MakeSpace-project';}
function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function queueSave(){
 saveTimer=null;const copy=structuredClone(doc),serial=++saveSerial;
 saveQueue=saveQueue.catch(()=>{}).then(()=>storeProject(copy)).then(()=>{if(doc.id===copy.id&&serial===saveSerial&&!saveTimer){$('save-state').textContent='● Saved on this device';try{localStorage.setItem('makespace-active-v1',doc.id);}catch{}}}).catch(error=>{if(doc.id===copy.id)$('save-state').textContent='Not saved · download a Project ZIP';console.warn('Project save failed',error);});return saveQueue;
}
function persist(){doc.updated=Date.now();$('save-state').textContent='Saving…';clearTimeout(saveTimer);saveTimer=setTimeout(queueSave,200);}
async function flushSave(){if(saveTimer){clearTimeout(saveTimer);queueSave();}await saveQueue;}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&doc)flushSave();});

function modelingState(){return{code:doc.code,values:{...doc.values},settings:structuredClone(doc.settings),files:[...doc.files],entryPath:doc.entryPath,templateId:doc.templateId,color:doc.color};}
function snapshot(){undo.push(modelingState());if(undo.length>40)undo.shift();redo=[];updateUndo();}
function groupChange(key){const now=performance.now();if(key!==editGroup||now-editTime>900)snapshot();editGroup=key;editTime=now;}
function updateUndo(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;}
function setValue(name,value){if(JSON.stringify(doc.values[name]??parameters(doc.code).find(f=>f.name===name)?.value)===JSON.stringify(value))return;groupChange(name);doc.values[name]=value;persist();schedule();}
function emptySettings(){const p=node('p','This file has no simple student controls yet. Teacher tools can expose settings, or you can build and download it as it is.','empty');$('controls').append(p);}
function renderControls(){
 const fields=settingsFor(doc.code,doc.values,doc.settings).filter(f=>!f.hidden);$('controls').replaceChildren();if(!fields.length)emptySettings();let group='';
 for(const f of fields){
  const visualPattern=doc.templateId==='puzzle'&&f.name==='pattern';
  if(visualPattern){f.group='Your piece';f.label=doc.settings[f.name]?.label||'Draw your piece';}
  if(f.group!==group){group=f.group;$('controls').append(node('h4',group,'control-group'));}
  const wrap=node('div',undefined,'field'),head=node('div',undefined,'field-head'),label=node('label',f.label);label.htmlFor='param-'+f.name;head.append(label);wrap.append(head);let input=node('input');input.id=label.htmlFor;
  if(visualPattern){label.removeAttribute('for');const grid=createPatternEditor(f.value,value=>{editGroup='';setValue(f.name,value);});wrap.append(grid);const normalized=encodePattern(patternRows(f.value));if(/^[x.|]+$/.test(f.value)&&normalized!==f.value)setValue(f.name,normalized);}
  else if(f.choices){input=node('select');input.id=label.htmlFor;for(const choice of f.choices){const opt=node('option',choice.label);opt.value=JSON.stringify(choice.value);input.append(opt);}input.value=JSON.stringify(f.value);input.onchange=()=>setValue(f.name,JSON.parse(input.value));wrap.append(input);}
  else if(typeof f.value==='boolean'){input.type='checkbox';input.checked=f.value;input.onchange=()=>setValue(f.name,input.checked);head.append(input);}
  else if(typeof f.value==='number'){
   input.type='number';input.className='number';input.value=f.value;input.step=f.step||'any';if(f.min!==undefined)input.min=f.min;if(f.max!==undefined)input.max=f.max;head.append(input);let slider;
   if(f.min!==undefined&&f.max!==undefined){slider=node('input');slider.type='range';slider.min=f.min;slider.max=f.max;slider.step=f.step||'any';slider.value=f.value;slider.setAttribute('aria-label',f.label+' slider');slider.oninput=()=>{input.value=slider.value;setValue(f.name,Number(slider.value));};wrap.append(slider);const limits=node('div',undefined,'range-labels');limits.append(node('span',f.min),node('span',f.max));wrap.append(limits);}
   input.oninput=()=>{if(input.value===''||!Number.isFinite(Number(input.value))){pause(`Enter a number for ${f.label}.`);return;}if(slider)slider.value=input.value;setValue(f.name,Number(input.value));};input.onchange=()=>{if(input.value===''){input.value=doc.values[f.name]??f.value;schedule();}};
  }else if(Array.isArray(f.value)){
   const vector=node('div',undefined,'vectors');f.value.forEach((v,i)=>{const component=node('input');component.type='number';component.step='any';component.value=v;component.className='number';component.setAttribute('aria-label',f.label+' '+['X','Y','Z','W'][i]);component.oninput=()=>{if(component.value===''){pause('Complete every number in this setting.');return;}const value=[...(doc.values[f.name]||f.value)];value[i]=Number(component.value);setValue(f.name,value);};vector.append(component);});wrap.append(vector);
  }else{input.type='text';input.value=f.value;input.maxLength=doc.templateId==='tag'&&f.name==='name'?16:250;input.oninput=()=>setValue(f.name,input.value);wrap.append(input);}
  if(f.description&&!visualPattern)wrap.append(node('p',f.description,'description'));$('controls').append(wrap);
 }
 updateUndo();
}
function renderChallenge(){
 const p=template(doc.templateId),content=$('challenge-content');content.replaceChildren();
 if(!p){content.append(node('h3','Your own design challenge'),node('p','What should this model do? Choose one setting to change, predict what will happen, then test the result.'));$('challenge').textContent='Change one setting at a time. What do you notice?';$('connection').textContent='Customize the model here, export an STL, then add it to a larger design in your visual editor.';return;}
 content.append(node('h3',p.question),node('p',p.time));const chips=node('div',undefined,'skill-chips');p.skills.forEach(s=>chips.append(node('span',s)));content.append(chips,node('h4','Your mission'));const steps=node('ol');p.steps.forEach(s=>steps.append(node('li',s)));content.append(steps,node('h4','What success looks like'));const criteria=node('ul');p.criteria.forEach(s=>criteria.append(node('li',s)));content.append(criteria);const b=node('button','Start my design notebook →','secondary');b.onclick=()=>showWorkspace('notebook');content.append(b);$('challenge').textContent=p.hint;$('connection').textContent=p.connection;
}
function renderHeader(){
 const p=template(doc.templateId);$('project-title').textContent=doc.title;$('project-level').textContent=p?p.level:'YOUR OWN DESIGN';$('project-question').textContent=p?.question||'Your code. Your settings. Your next experiment.';
 document.querySelectorAll('.project').forEach(b=>{const active=b.dataset.id===doc.templateId;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'true':'false');});
 $('part').replaceChildren();$('part-wrap').hidden=!p?.parts;
 for(const[id,label]of p?.parts||[]){const option=node('option',label);option.value=id;$('part').append(option);}$('part').value=doc.values.part||'all';
 viewer.setColor(doc.color);document.querySelectorAll('[data-color]').forEach(b=>b.classList.toggle('selected',b.dataset.color===doc.color));
}
function renderNotebook(){
 for(const id of ['goal','prediction','reflection'])$(id).value=doc.notebook[id]||'';
 $('trial-count').textContent=doc.notebook.trials.length;$('trials').replaceChildren();
 if(!doc.notebook.trials.length)$('trials').append(node('p','No trials yet. Build a design, make a prediction, then record its settings here.','empty'));
 const fieldLabels=Object.fromEntries(parameters(doc.code).map(f=>[f.name,f.label]));
 doc.notebook.trials.forEach((trial,i)=>{
  const card=node('article',undefined,'trial'),head=node('div',undefined,'trial-title');head.append(node('h4',`Trial ${i+1}`),node('span',new Date(trial.time).toLocaleString()));const restore=node('button','Use these settings','restore');restore.onclick=()=>{snapshot();doc.values={...trial.settings};renderControls();renderHeader();persist();schedule();showWorkspace('design');toast(`Settings from trial ${i+1} restored.`);};head.append(restore);card.append(head);
  const settings=node('div',undefined,'trial-settings');Object.entries(trial.settings).forEach(([k,v])=>settings.append(node('span',`${fieldLabels[k]||k}: ${Array.isArray(v)?v.join(', '):v}`)));card.append(settings,node('p',trial.prediction?'Prediction: '+trial.prediction:'No prediction recorded.','trial-prediction'));
  const label=node('label','What happened?'),textarea=node('textarea');textarea.maxLength=3000;textarea.value=trial.result||'';textarea.placeholder='Record the fit, a measurement, or what you observed.';textarea.oninput=()=>{trial.result=textarea.value;persist();};label.append(textarea);card.append(label);$('trials').append(card);
 });
}
function renderTeacher(){
 $('source').value=doc.draftCode??doc.code;$('draft-state').textContent=doc.draftCode&&doc.draftCode!==doc.code?'Draft saved on this device. Select Update project to build these changes.':'';
 $('teacher-controls').replaceChildren();for(const f of parameters(doc.code)){const row=node('div',undefined,'teacher-setting');row.dataset.name=f.name;const show=node('input');show.type='checkbox';show.checked=!doc.settings[f.name]?.hidden;show.setAttribute('aria-label','Show '+f.label+' to students');const label=node('input');label.type='text';label.maxLength=80;label.value=doc.settings[f.name]?.label||f.label;label.setAttribute('aria-label','Label for '+f.name);row.append(show,label,node('small',f.name+(f.min!==undefined?` · ${f.min} to ${f.max}`:'')));$('teacher-controls').append(row);}
 $('files-list').replaceChildren();for(const file of doc.files){const li=node('li');li.append(node('span',file.name+' · '+Math.ceil(file.bytes.byteLength/1024)+' KB'));const remove=node('button','Remove');remove.onclick=()=>{snapshot();doc.files=doc.files.filter(f=>f!==file);persist();renderTeacher();schedule();};li.append(remove);$('files-list').append(li);}if(!doc.files.length)$('files-list').append(node('li','No extra files. PuzzleCAD is included automatically.'));
}
function renderAll(){renderHeader();renderControls();renderChallenge();renderNotebook();if($('teacher-dialog').open)renderTeacher();}
function cancel(){clearTimeout(buildTimer);clearTimeout(buildTimeout);worker?.terminate();worker=null;}
function invalidate(){stl=null;currentInfo=null;$('download').disabled=true;$('record-trial').disabled=true;$('enable-example').hidden=true;$('retry').hidden=true;$('mesh-info').textContent='';}
function fail(error,problem){cancel();invalidate();viewer.clear();shownDocument=null;$('loading').hidden=true;$('dimensions').textContent='No model built';$('logs').textContent=error;const issue=problem||buildProblem([error],doc.code);status(issue.title,issue.detail,true);$('enable-example').hidden=issue.kind!=='tutorial-empty';$('retry').hidden=issue.kind==='tutorial-empty';}
function pause(message='Build paused.'){cancel();revision++;invalidate();$('loading').hidden=true;$('dimensions').textContent='Build paused';status(message,'Your saved settings are safe. Complete the setting or build again.');$('retry').hidden=false;}
function schedule(){cancel();revision++;invalidate();const issues=validateValues(doc.code,doc.values,doc.templateId);if(issues.length){fail(issues.join('\n'),{kind:'settings',title:'One setting needs a little attention.',detail:issues[0]});return;}$('loading').hidden=false;$('loading-text').textContent='Updating your design…';status('Making your changes…','The same geometry will be used for your STL download.');buildTimer=setTimeout(build,350);}
function build(){
 const ticket=revision,id=doc.id;worker=new Worker('./worker.js',{type:'module'});$('loading-text').textContent='Building your design…';
 worker.onerror=e=>{if(ticket===revision&&doc.id===id)fail(e.message||'The model builder could not start.');};
 worker.onmessage=({data})=>{
  if(ticket!==revision||doc.id!==id)return;if(data.error){fail(data.error,data.problem);return;}
  try{const info=inspectSTL(data.bytes);viewer.show(info,shownDocument===id);shownDocument=id;currentInfo=info;stl=data.bytes;$('dimensions').textContent=info.size.toArray().map(n=>Math.round(n*10)/10).join(' × ')+' mm';$('loading').hidden=true;$('download').disabled=false;$('record-trial').disabled=false;$('logs').textContent=data.messages.join('\n');const warnings=data.messages.some(t=>/WARNING:/i.test(t));status(warnings||info.closed===false?'Preview built. Check before printing.':'Your design is ready to explore.',warnings?'A build note needs a teacher’s review. Open Build details in Teacher tools.':info.closed===false?'Some mesh edges need checking in your slicer.':'Record a prediction, test your design, then make the next version.');$('mesh-info').textContent=`${info.triangles.toLocaleString()} triangles · ${info.volume.toFixed(1)} cm³ solid volume${info.closed===false?' · check mesh edges':''}`;cancel();}catch(error){fail(error.message);}
 };
 buildTimeout=setTimeout(()=>{if(ticket===revision)fail('This build took longer than 60 seconds. Simplify the model or lower its curve detail.',{kind:'timeout',title:'This design needs more time than the browser allows.',detail:'Try fewer details or a smaller model. Your project is still saved.'});},60000);
 worker.postMessage({code:doc.code,values:doc.values,files:doc.files,entryPath:doc.entryPath,templateId:doc.templateId});
}
function showWorkspace(tab){for(const name of ['design','notebook']){$(name+'-tab').setAttribute('aria-selected',name===tab);$(name+'-panel').hidden=name!==tab;}if(tab==='notebook')renderNotebook();}
function showPanel(tab){for(const name of ['settings','challenge']){$(name+'-tab').setAttribute('aria-selected',name===tab);$(name+'-panel').hidden=name!==tab;}}
async function openDocument(next){await flushSave();cancel();revision++;doc=next;viewer.clear();$('dimensions').textContent='Building your design…';undo=[];redo=[];editGroup='';shownDocument=null;renderAll();showWorkspace('design');showPanel('settings');persist();schedule();}
async function startTemplate(p){if(doc.templateId===p.id)return;await flushSave();let next;try{next=(await listProjects()).find(d=>!d.archived&&d.templateId===p.id);}catch{}await openDocument(next||newProject(p));}
function recordTrial(){if(doc.notebook.trials.length>=100){toast('This notebook has 100 trials. Save a copy to start a new set.');return;}if(!currentInfo){toast('Build a valid model before recording this trial.');return;}const settings=Object.fromEntries(parameters(doc.code).map(f=>[f.name,doc.values[f.name]??f.value]));if(doc.values.part)settings.part=doc.values.part;doc.notebook.trials.push({id:crypto.randomUUID(),time:Date.now(),settings,prediction:doc.notebook.prediction,result:''});persist();renderNotebook();showWorkspace('notebook');toast('Settings recorded. Test your design and add what happened.');}
async function openShelf(){await flushSave();try{shelfRecords=await listProjects();renderShelf();$('shelf-dialog').showModal();}catch{toast('The project shelf is unavailable. Download a Project ZIP to keep your work.');}}
function renderShelf(){
 const query=$('project-search').value.toLowerCase();$('shelf-list').replaceChildren();$('archived-list').replaceChildren();
 for(const saved of shelfRecords.filter(p=>p.title.toLowerCase().includes(query))){const card=node('article',undefined,'shelf-card');card.append(node('h3',saved.title),node('p',`${template(saved.templateId)?.category||'Imported / custom'} · ${new Date(saved.updated).toLocaleDateString()} · ${saved.notebook?.trials?.length||0} trials`));const actions=node('div');if(saved.archived){const restore=node('button','Restore');restore.onclick=async()=>{saved.archived=false;await storeProject(saved);renderShelf();};actions.append(restore);}else{const open=node('button',saved.id===doc.id?'Current project':'Open project','open-saved');open.disabled=saved.id===doc.id;open.onclick=()=>{$('shelf-dialog').close();openDocument(saved);};const archive=node('button','Archive');archive.disabled=saved.id===doc.id;archive.title=saved.id===doc.id?'Open another project before archiving this one.':'You can restore this project later.';archive.onclick=async()=>{saved.archived=true;await storeProject(saved);renderShelf();};actions.append(open,archive);}card.append(actions);$(saved.archived?'archived-list':'shelf-list').append(card);}
 if(!$('shelf-list').children.length)$('shelf-list').append(node('p','No matching projects yet. Start a challenge or open a .scad file.','empty'));
}
function showName(action){nameAction=action;$('name-dialog-title').textContent=action==='copy'?'Keep a new version':'Name your project';$('project-name').value=doc.title+(action==='copy'?' — version 2':'');$('name-dialog').showModal();$('project-name').focus();$('project-name').select();}
async function readZip(bytes){return new Promise((resolve,reject)=>{const reader=new Worker('./archive-worker.js',{type:'module'});const timeout=setTimeout(()=>{reader.terminate();reject(Error('This ZIP took too long to open. Try a smaller archive.'));},10000);reader.onmessage=({data})=>{clearTimeout(timeout);reader.terminate();data.error?reject(Error(data.error)):resolve(data.result);};reader.onerror=()=>{clearTimeout(timeout);reader.terminate();reject(Error('The ZIP could not be read.'));};reader.postMessage(bytes);});}
async function openFile(file){
 if(file.size>MAX_BYTES)throw Error('Keep project files smaller than 40 MB.');
 if(/\.zip$/i.test(file.name)){const result=await readZip(await file.arrayBuffer());if(result.document){await openDocument(result.document);toast('Project, supporting files, and notebook restored.');}else if(result.candidates.length===1){await openDocument(projectFromEntry(result.entries,result.candidates[0]));}else{pendingZip=result;$('zip-entry').replaceChildren();for(const name of result.candidates){const option=node('option',name);option.value=name;$('zip-entry').append(option);}$('zip-dialog').showModal();}}
 else if(/\.scad$/i.test(file.name)){if(file.size>2e6)throw Error('Keep the main .scad source smaller than 2 MB.');await openDocument(normalizeProject({title:file.name.replace(/\.scad$/i,''),code:await file.text(),entryPath:safePath(file.name)}));}
 else throw Error('Choose a .scad file or a project ZIP.');
}
async function addDependencies(selected){
 if(selected.reduce((n,f)=>n+f.size,0)>MAX_BYTES)throw Error('Keep supporting files under 40 MB total.');const additions=[];
 for(const file of selected){if(/\.zip$/i.test(file.name)){const result=await readZip(await file.arrayBuffer());for(const[name,bytes]of Object.entries(result.entries))if(/\.(scad|stl|svg|ttf|otf)$/i.test(name)&&name!==doc.entryPath)additions.push({name:safePath(name),bytes});}else if(/\.(scad|stl|svg|ttf|otf)$/i.test(file.name)){if(file.name===doc.entryPath)throw Error('Use Open a project to replace the main source file.');additions.push({name:safePath(file.name),bytes:new Uint8Array(await file.arrayBuffer())});}}
 const merged=new Map(doc.files.map(f=>[f.name,f]));for(const f of additions)merged.set(f.name,f);if([...merged.values()].reduce((n,f)=>n+f.bytes.byteLength,0)>MAX_BYTES)throw Error('The combined supporting files exceed 40 MB.');snapshot();doc.files=[...merged.values()];persist();renderTeacher();schedule();toast(`${additions.length} supporting files added. Folder paths were kept.`);
}
async function exportProject(){
 const saved=structuredClone(doc),bytes=stl?stl.slice():null;toast('Packing your project, files, and notebook…');try{const extra=saved.code+JSON.stringify(saved.values),textCode=await textSupport(extra);let library=null;if(/puzzlecad/i.test(extra+saved.files.filter(f=>f.name.endsWith('.scad')).map(f=>new TextDecoder().decode(f.bytes)).join(''))){const r=await fetch('./libraries/puzzlecad-2.2.json');if(!r.ok)throw Error('Could not include PuzzleCAD in the project.');library=await r.json();}const archive=await projectArchive(saved,{textCode,library,stl:bytes});download(archive,cleanName(saved.title)+'.makespace.zip','application/zip');toast('Project ZIP downloaded. Keep it as your editable backup.');}catch(error){toast(error.message);}}
async function exportSource(){try{const saved=structuredClone(doc),shim=await textSupport(saved.code+JSON.stringify(saved.values));const license=await(await fetch('./vendor/Abel-OFL.txt')).text();download(applyValues(saved.code,saved.values)+'\n'+shim+'\n/*\n'+license+'\n*/\n',cleanName(saved.title)+'.scad','text/plain');toast('SCAD downloaded. Use Project ZIP when supporting files are needed.');}catch(error){toast(error.message);}}
for(const p of projects){const button=node('button',undefined,'project');button.dataset.id=p.id;button.style.setProperty('--accent',p.accent);const text=node('span');text.append(node('strong',p.title),node('small',p.tag),node('em',p.level));button.append(node('span',p.icon,'project-icon'),text);button.onclick=()=>startTemplate(p);$('projects').append(button);}
$('design-tab').onclick=()=>showWorkspace('design');$('notebook-tab').onclick=()=>showWorkspace('notebook');$('settings-tab').onclick=()=>showPanel('settings');$('challenge-tab').onclick=()=>showPanel('challenge');
$('home').onclick=()=>viewer.fit();$('top').onclick=()=>viewer.fit(true);$('zoom-in').onclick=()=>viewer.zoom(.8);$('zoom-out').onclick=()=>viewer.zoom(1.25);$('part').onchange=()=>{groupChange('part');doc.values.part=$('part').value;shownDocument=null;persist();schedule();};
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{doc.color=b.dataset.color;viewer.setColor(doc.color);document.querySelectorAll('[data-color]').forEach(el=>el.classList.toggle('selected',el===b));persist();});
$('undo').onclick=()=>{if(!undo.length)return;redo.push(modelingState());Object.assign(doc,undo.pop());editGroup='';renderAll();persist();schedule();};$('redo').onclick=()=>{if(!redo.length)return;undo.push(modelingState());Object.assign(doc,redo.pop());editGroup='';renderAll();persist();schedule();};
$('reset').onclick=()=>{snapshot();doc.values={};editGroup='';renderControls();renderHeader();persist();schedule();};$('retry').onclick=schedule;$('cancel-build').onclick=()=>pause();
$('enable-example').onclick=()=>{const enabled=enableFirstTutorialExample(doc.code);if(enabled===doc.code)return;snapshot();doc.code=enabled;doc.draftCode=undefined;renderControls();persist();schedule();};
$('teacher').onclick=()=>{renderTeacher();$('teacher-dialog').showModal();};$('help').onclick=()=>$('help-dialog').showModal();$('handoff').onclick=()=>$('handoff-dialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('apply').onclick=()=>{snapshot();doc.code=$('source').value;doc.draftCode=undefined;doc.values={};doc.templateId=null;renderHeader();renderControls();renderChallenge();renderTeacher();persist();schedule();toast('Code updated. Your previous code is available with Undo.');};
$('source').oninput=()=>{doc.draftCode=$('source').value;$('draft-state').textContent='Draft kept separately. Select Update project to build it.';persist();};
$('apply-controls').onclick=()=>{snapshot();for(const row of $('teacher-controls').children){const [show,label]=row.querySelectorAll('input');doc.settings[row.dataset.name]={hidden:!show.checked,label:label.value.trim()||row.dataset.name};}renderControls();persist();toast('Student controls saved.');};
$('new-blank').onclick=async()=>{await openDocument(normalizeProject({title:'My new design',code:'// Set a size, then build a shape.\nsize = 20; // [5:1:80]\ncube(size);'}));renderTeacher();toast('New project created. Your previous project is on the shelf.');};
$('open').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{await openFile(file);}catch(error){toast(error.message);}$('file').value='';};
$('dependencies').onclick=()=>$('dep-files').click();$('dep-files').onchange=async()=>{try{await addDependencies([...$('dep-files').files]);}catch(error){toast(error.message);}$('dep-files').value='';};
$('open-zip-entry').onclick=async()=>{try{const next=projectFromEntry(pendingZip.entries,$('zip-entry').value);$('zip-dialog').close();await openDocument(next);}catch(error){toast(error.message);}};
$('shelf').onclick=openShelf;$('project-search').oninput=renderShelf;$('rename').onclick=()=>showName('rename');$('save-copy').onclick=()=>showName('copy');
$('name-form').onsubmit=async e=>{e.preventDefault();const title=$('project-name').value.trim();if(!title)return;if(nameAction==='copy'){const copy=structuredClone(doc);copy.id=crypto.randomUUID();copy.title=title;copy.created=Date.now();delete copy.archived;await openDocument(copy);}else{doc.title=title;renderHeader();persist();}$('name-dialog').close();toast(nameAction==='copy'?'A new version is saved on your shelf.':'Project renamed.');};
for(const id of ['goal','prediction','reflection'])$(id).oninput=()=>{doc.notebook[id]=$(id).value;persist();};$('record-trial').onclick=recordTrial;$('record-from-notebook').onclick=recordTrial;
const downloadNotebook=()=>download(notebookMarkdown(doc),cleanName(doc.title)+'-notebook.md','text/markdown');$('download-notebook').onclick=downloadNotebook;
$('more-export').onclick=()=>{const open=$('export-menu').hidden;$('export-menu').hidden=!open;$('more-export').setAttribute('aria-expanded',open);};document.addEventListener('click',e=>{if(!e.target.closest('.export-group')){$('export-menu').hidden=true;$('more-export').setAttribute('aria-expanded','false');}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('export-menu').hidden=true;$('more-export').setAttribute('aria-expanded','false');}});
$('download').onclick=()=>{if(stl)download(stl,cleanName(doc.title)+(doc.values.part&&doc.values.part!=='all'?'-'+doc.values.part:'')+'.stl','model/stl');};
for(const[id,action]of[['export-project',exportProject],['save-scad',exportSource],['export-notebook',downloadNotebook],['export-image',()=>{if(!stl){toast('Build a model before saving its image.');return;}const image=viewer.image();if(!image){toast('A preview image is unavailable in this browser.');return;}const a=node('a');a.href=image;a.download=cleanName(doc.title)+'.png';a.click();}]])$(id).onclick=()=>{$('export-menu').hidden=true;$('more-export').setAttribute('aria-expanded','false');action();};
// Keep left/right keyboard navigation local to each tab list.
document.querySelectorAll('[role=tablist]').forEach(list=>list.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...list.querySelectorAll('[role=tab]')],index=tabs.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();});
async function initialize(){
 try{
  if(!localStorage.getItem('makespace-v1-migrated')){const old=JSON.parse(localStorage.getItem('makespace-project')||'null');if(old?.code){const migrated=normalizeProject(old);migrated.title=(old.title||'My prototype project')+' (prototype)';await storeProject(migrated);}localStorage.setItem('makespace-v1-migrated','yes');}
  const active=localStorage.getItem('makespace-active-v1');doc=active?await getProject(active):null;if(doc?.archived)doc=null;
 }catch{toast('Browser saving is unavailable. Download a Project ZIP to keep your work.');}
 doc ||= newProject(projects[0]);doc.notebook ||= {goal:'',prediction:'',reflection:'',trials:[]};doc.settings ||= {};doc.files ||= [];
 renderAll();persist();schedule();
}
initialize().catch(error=>{console.error(error);$('project-title').textContent='Your studio could not open.';status('Please reload the page.',error.message,true);});

// Cache application assets only. Student projects remain in the project database.
let offlineReady=false;
function connectionState(){$('offline-state').textContent=navigator.onLine?(offlineReady?'Offline ready':'On this device'):(offlineReady?'Offline session':'Offline');}
window.addEventListener('online',connectionState);window.addEventListener('offline',connectionState);
window.addEventListener('pagehide',()=>{if(doc)flushSave();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;connectionState();}).catch(()=>{});}
