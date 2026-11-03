import {patternIssue} from './pattern.js';
const number='[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
const literal=`(?:"(?:[^"\\\\]|\\\\.)*"|true|false|${number}|\\[\\s*${number}(?:\\s*,\\s*${number}){1,3}\\s*\\])`;
const assignment=new RegExp(`^\\s*([$a-zA-Z_]\\w*)\\s*=\\s*(${literal})\\s*;\\s*$`);
function parseLiteral(s){if(s.startsWith('['))return s.slice(1,-1).split(',').map(Number);if(/^[-+.\d]/.test(s))return Number(s);return JSON.parse(s);}
export function parameters(source,{includeHidden=false}={}){
 const result=[];let block=false,depth=0,paren=0,hidden=false,description='',group='Make it yours',offset=0;
 for(const original of source.split('\n')){
  const section=!block&&original.match(/^\s*\/\*\s*\[([^\]]+)\]\s*\*\/\s*$/);
  if(section){group=section[1];hidden=group.toLowerCase()==='hidden';description='';}
  let line='',comment='',quoted=false,escape=false;
  for(let i=0;i<original.length;i++){
   const c=original[i],n=original[i+1];
   if(block){line+=' ';if(c==='*'&&n==='/'){block=false;line+=' ';i++;}continue;}
   if(!quoted&&c==='/'&&n==='*'){block=true;line+='  ';i++;continue;}
   if(!quoted&&c==='/'&&n==='/'){comment=original.slice(i);line+=' '.repeat(original.length-i);break;}
   line+=c;if(c==='"'&&!escape)quoted=!quoted;escape=c==='\\'&&!escape;
  }
  const m=depth===0&&paren===0&&(!hidden||includeHidden)&&line.match(assignment);
  if(m){
   let value;try{value=parseLiteral(m[2]);}catch{offset+=original.length+1;continue;}
   if(typeof value==='number'&&!Number.isFinite(value)){offset+=original.length+1;continue;}
   const valueStart=line.indexOf(m[2],line.indexOf('=')+1);
   const f={name:m[1],label:m[1].replace(/^\$/,'').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase()),value,description,group,start:offset+valueStart,end:offset+valueStart+m[2].length};
   const annotation=comment.match(/^\/\/\s*\[([^\]]+)\]/)?.[1];
   if(annotation){
    const range=annotation.split(':').map(Number);
    if(typeof value==='number'&&!annotation.includes(',')&&(range.length===2||range.length===3)&&range.every(Number.isFinite)&&range[0]<range.at(-1)){
     f.min=range[0];f.max=range.at(-1);f.step=range.length===3?range[1]:1;if(f.step<=0)delete f.step;
    }else if(!Array.isArray(value)){
     f.choices=annotation.split(',').map(item=>{const [raw,...label]=item.trim().split(':');const v=typeof value==='number'?Number(raw):typeof value==='boolean'?(raw==='true'?true:raw==='false'?false:undefined):raw;return{value:v,label:label.join(':').trim()||raw};}).filter(c=>c.value!==undefined&&(typeof c.value!=='number'||Number.isFinite(c.value)));
     if(f.choices.length<1)delete f.choices;
    }
   }
   result.push(f);description='';
  }else if(!block&&/^\s*\/\//.test(original))description=original.trim().slice(2).trim();
  const structural=line.replace(/"(?:[^"\\]|\\.)*"/g,'');
  depth+=(structural.match(/{/g)||[]).length-(structural.match(/}/g)||[]).length;
  paren+=(structural.match(/\(/g)||[]).length-(structural.match(/\)/g)||[]).length;
  offset+=original.length+1;
 }
 return result;
}
export function definitions(values){return Object.entries(values).filter(([k,v])=>/^[$a-zA-Z_]\w*$/.test(k)&&v!==undefined).flatMap(([k,v])=>['-D',`${k}=${JSON.stringify(v)}`]);}
export function applyValues(code,values){for(const f of parameters(code,{includeHidden:true}).reverse()){if(Object.hasOwn(values,f.name))code=code.slice(0,f.start)+JSON.stringify(values[f.name])+code.slice(f.end);}return code;}
export function settingsFor(code,values={},overrides={}){return parameters(code).map(f=>({...f,...overrides[f.name],name:f.name,value:Object.hasOwn(values,f.name)?values[f.name]:f.value}));}
export function validateValues(code,values={},templateId=null){
 const issues=[];
 for(const f of parameters(code)){
  const v=Object.hasOwn(values,f.name)?values[f.name]:f.value;
  if(Array.isArray(f.value)){if(!Array.isArray(v)||v.length!==f.value.length||!v.every(Number.isFinite))issues.push(`${f.label} needs ${f.value.length} numbers.`);}
  else if(typeof v!==typeof f.value||typeof v==='number'&&!Number.isFinite(v))issues.push(`Check the value for ${f.label}.`);
  else if(typeof v==='number'&&(f.min!==undefined&&v<f.min||f.max!==undefined&&v>f.max))issues.push(`${f.label} must be between ${f.min} and ${f.max}.`);
  else if(typeof v==='string'&&v.length>250)issues.push(`${f.label} is too long. Keep it under 250 characters.`);
  if(f.choices&&!f.choices.some(c=>c.value===v))issues.push(`Choose one of the options for ${f.label}.`);
 }
 const v=Object.fromEntries(parameters(code).map(f=>[f.name,Object.hasOwn(values,f.name)?values[f.name]:f.value]));
 if(templateId==='tag'&&(!v.name?.trim()||v.name.length>16))issues.push('Use a message with 1–16 characters.');
 if(templateId==='cup'&&(!Number.isInteger(v.columns)||!Number.isInteger(v.rows)))issues.push('Use whole numbers for rows and columns.');
 if(templateId==='puzzle'){const issue=patternIssue(v.pattern);if(issue)issues.push(issue);}
 return issues;
}
