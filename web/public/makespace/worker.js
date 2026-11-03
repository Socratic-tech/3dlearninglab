import {compileProject} from './compiler.js';
self.onmessage=async({data})=>{const result=await compileProject(data);self.postMessage(result);};
