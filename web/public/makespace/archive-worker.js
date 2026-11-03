import {readArchive} from './archive.js';
self.onmessage=({data})=>{try{self.postMessage({result:readArchive(data)});}catch(error){self.postMessage({error:error.message||String(error)});}};
