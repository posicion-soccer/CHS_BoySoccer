// Parse the school athletics export entirely in the browser.
(() => {
 const limit=200;
 const key=name=>name.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
 function parse(text){
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],field='',quoted=false,closed=false;
  function endField(){row.push(field.trim());field='';closed=false;}
  function endRow(){endField();if(row.some(Boolean))rows.push(row);row=[];}
  for(let i=0;i<text.length;i++){
   const c=text[i];
   if(quoted){
    if(c==='"'&&text[i+1]==='"'){field+='"';i++;}
    else if(c==='"'){quoted=false;closed=true;}
    else field+=c;
   }else if(c===',')endField();
   else if(c==='\r'||c==='\n'){endRow();if(c==='\r'&&text[i+1]==='\n')i++;}
   else if(closed){if(c!==' '&&c!=='\t')throw Error('A quoted CSV field is malformed.');}
   else if(c==='"'){if(field)throw Error('A quoted CSV field is malformed.');quoted=true;}
   else field+=c;
  }
  if(quoted)throw Error('A quoted CSV field is missing its closing quote.');
  endRow();
  const headers=(rows.shift()||[]).map(key);
  const column=name=>headers.indexOf(name);
  if(['first name','last name','grade'].some(n=>column(n)<0))throw Error('Choose a roster CSV with First Name, Last Name, and Grade columns.');
  if(!rows.length)throw Error('There are no players in this CSV.');
  if(rows.length>limit)throw Error('Choose a CSV with 200 players or fewer.');
  return rows.map((r,i)=>{
   const first=r[column('first name')],last=r[column('last name')],grade=r[column('grade')];
   const preferred=r[column('preferred first name')]||first;
   const fullName=(first+' '+last).replace(/\s+/g,' '),name=(preferred+' '+last).replace(/\s+/g,' ');
   if(r.length!==headers.length||!first||!last||name.length>80||fullName.length>80||!(/^(?:[6-9]|1[0-2])?$/.test(grade)))throw Error('Check the name and grade for player row '+(i+1)+'.');
   return {name,fullName,grade};
  });
 }
 function review(rows,players){
  const seen=new Set(players.map(p=>key(p.name))), additions=[];let skipped=0;
  for(const p of rows){
   const names=[key(p.name),key(p.fullName)];
   if(names.some(n=>seen.has(n))){skipped++;continue;}
   names.forEach(n=>seen.add(n));additions.push(p);
  }
  if(players.length+additions.length>limit)throw Error('This import would exceed the 200-player roster limit.');
  return {additions,skipped};
 }
 window.ROSTER_IMPORT={parse,review};
})();
