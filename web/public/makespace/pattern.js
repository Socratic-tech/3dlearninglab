export function patternRows(pattern){const rows=String(pattern||'').split('|');const width=Math.max(1,...rows.map(r=>r.length));return rows.map(r=>Array.from({length:width},(_,x)=>r[x]==='x'));}
export function encodePattern(rows){return rows.map(r=>r.map(v=>v?'x':'.').join('')).join('|');}
export function patternIssue(pattern){
 const rows=String(pattern||'').split('|');
 if(!/^[x.|]+$/.test(pattern)||pattern.length>65||rows.some(r=>!r.length)||new Set(rows.map(r=>r.length)).size>1)return 'Choose a smaller rectangular drawing, or use one of the starter shapes.';
 const occupied=new Set();rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='x')occupied.add(`${x},${y}`);}));
 if(!occupied.size)return 'Click at least one square to add a block to your piece.';
 const seen=new Set(),queue=[[...occupied][0]];while(queue.length){const p=queue.pop();if(seen.has(p))continue;seen.add(p);const[x,y]=p.split(',').map(Number);for(const[a,b]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=`${a},${b}`;if(occupied.has(k)&&!seen.has(k))queue.push(k);}}
 return seen.size===occupied.size?null:'Connect the colored squares along their edges so your piece stays together.';
}
export function createPatternEditor(pattern,onChange){
 let rows=patternRows(pattern);const root=document.createElement('div');root.className='pattern-editor';
 const intro=document.createElement('p');intro.className='pattern-intro';intro.textContent='Click a square to add or remove a block.';root.append(intro);
 const sizes=document.createElement('div');sizes.className='pattern-sizes';const selects=[];
 for(const[label,max,current]of[['Squares across',8,rows[0].length],['Rows deep',7,rows.length]]){const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');select.setAttribute('aria-label',label);for(const n of [...new Set([...Array.from({length:max},(_,i)=>i+1),current])].sort((a,b)=>a-b)){const option=document.createElement('option');option.value=n;option.textContent=n;select.append(option);}select.value=current;wrap.append(select);sizes.append(wrap);selects.push(select);}
 root.append(sizes);
 const canvas=document.createElement('div');canvas.className='pattern-canvas';canvas.setAttribute('role','group');canvas.setAttribute('aria-label','Puzzle drawing grid');root.append(canvas);
 const summary=document.createElement('p');summary.className='pattern-summary';summary.setAttribute('aria-live','polite');root.append(summary);
 const legend=document.createElement('p');legend.className='pattern-legend';legend.textContent='Colored = a solid block · Empty = a space';root.append(legend);
 const presets=document.createElement('div');presets.className='pattern-presets';
 for(const[label,value]of[['T shape','.x.|xxx'],['L shape','x..|xxx'],['Steps','xx.|.xx']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{rows=patternRows(value);commit();};presets.append(button);}root.append(presets);
 function commit(focus){const value=encodePattern(rows);selects[0].value=rows[0].length;selects[1].value=rows.length;draw(focus);onChange(value);}
 selects.forEach(select=>select.onchange=()=>{const w=Number(selects[0].value),h=Number(selects[1].value);rows=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>!!rows[y]?.[x]));commit();});
 function draw(focus){
  canvas.replaceChildren();canvas.style.setProperty('--columns',rows[0].length);
  rows.forEach((row,y)=>row.forEach((filled,x)=>{const button=document.createElement('button');button.type='button';button.className='pattern-cell'+(filled?' filled':'');button.setAttribute('aria-label',`Row ${y+1}, column ${x+1}`);button.setAttribute('aria-pressed',String(filled));button.title=filled?'Remove this block':'Add a block here';button.textContent=filled?'■':'＋';button.onclick=()=>{rows[y][x]=!rows[y][x];commit([x,y]);};button.onkeydown=e=>{const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!moves[e.key])return;e.preventDefault();const[dx,dy]=moves[e.key],nx=x+dx,ny=y+dy;if(nx>=0&&nx<row.length&&ny>=0&&ny<rows.length)canvas.children[ny*row.length+nx].focus();};canvas.append(button);}));
  const count=rows.flat().filter(Boolean).length,issue=patternIssue(encodePattern(rows));summary.textContent=issue||(count===1?'1 block · one connected piece':`${count} blocks · one connected piece`);summary.classList.toggle('needs-attention',!!issue);
  if(focus)canvas.children[focus[1]*rows[0].length+focus[0]]?.focus({preventScroll:true});
 }
 draw();return root;
}
