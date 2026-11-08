/* HW2 收数接口与匿名汇总。禁止将任何密钥存入前端。 */
(function(){'use strict';
const D={};const API=()=>LAB_CONFIG.API_BASE;const project=()=>LAB_CONFIG.PROJECT;
D.hasProject=()=>/^[A-Z0-9]{6}$/i.test(project())&&!/^X{6}$/i.test(project());
D.fetchProject=async()=>{if(!D.hasProject())throw Error('请先在 js/config.js 中填写真实的6位项目码');let url=API()+'/api/hw2/data?project='+encodeURIComponent(project());let ac=new AbortController();let timer=setTimeout(()=>ac.abort(),9000);try{const r=await fetch(url,{signal:ac.signal,cache:'no-store'});const json=await r.json();if(!r.ok||json.ok===false)throw Error(json.msg||'服务器未返回有效数据');return json}finally{clearTimeout(timer)}};
D.normalise=(obj)=>{
  // 兼容课堂平台可能返回的记录数组或逐试次列表；不猜测不存在的字段。
  let candidates=[];
  if(Array.isArray(obj))candidates=obj;
  for(const p of ['rows','trials','records','data','sessions','items','results']){let v=obj?.[p];if(Array.isArray(v)&&v.length>candidates.length)candidates=v;else if(v&&typeof v==='object'){for(const q of ['rows','records','trials','sessions','data'])if(Array.isArray(v[q])&&v[q].length>candidates.length)candidates=v[q]}}
  const out=[];for(const a of candidates){let p=a?.participant??a?.participant_id??a?.pid;let exp=a?.experiment??a?.exp;let group=a?.condition??a?.group??a?.display;let trials=a?.trials;
    if(Array.isArray(trials)){trials.forEach((t,i)=>out.push({...t,participant:String(p??''),experiment:String(exp??''),condition:String(group??t.group??''),trial_index:i+1}));}
    else if(a&&typeof a==='object')out.push({...a,participant:String(p??''),experiment:String(exp??''),condition:String(group??'')});
  }return out;
};
D.experimentBase=(id)=>String(id||'').replace(/^test_/,'');
D.isFormal=(r)=>!String(r.experiment||'').startsWith('test_');
D.getCounts=(rows,exp)=>{let sets={A:new Set(),B:new Set()};rows.filter(r=>D.experimentBase(r.experiment)===exp&&D.isFormal(r)).forEach(r=>{let g=String(r.group??r.condition??'').toUpperCase();let m=g.match(/(?:^|[^A-Z])([AB])(?:$|[^A-Z])/);g=m?m[1]:(g.startsWith('A')?'A':g.startsWith('B')?'B':'');if(sets[g]&&r.participant)sets[g].add(r.participant)});return {A:sets.A.size,B:sets.B.size}};
D.groupFor=async(exp,pid)=>{
  const key=`lab_assign_${exp}_${pid}`;let prev=U.safeStorage.get(key);if(prev==='A'||prev==='B')return {group:prev,source:'已保存的分配'};
  const code=String(pid).match(/^0?(\d{1,2})$/);let fallback=code?Number(code[1])%2?'A':'B':U.seed(pid+'_'+exp)%2?'A':'B';
  try{let resp=await D.fetchProject(),rows=D.normalise(resp);let existing=rows.find(r=>D.experimentBase(r.experiment)===exp&&r.participant===pid);if(existing){let old=String(existing.group??existing.condition??'').toUpperCase();if(old.startsWith('A')||old.startsWith('B')){let g=old[0];U.safeStorage.set(key,g);return{group:g,source:'已提交记录'}}}
    let c=D.getCounts(rows,exp);let group=c.A<c.B?'A':c.B<c.A?'B':fallback;U.safeStorage.set(key,group);return {group,source:`在线动态平衡（完成数A=${c.A}，B=${c.B}）`,counts:c};
  }catch(e){U.safeStorage.set(key,fallback);return {group:fallback,source:'离线/无法读取数据：匿名编号预分配',warning:e.message}}
};
D.validateTrials=(trials)=>{if(trials.length!==20)throw Error('正式试次不等于20次，请检查');for(const t of trials){if(Object.keys(t).length>40)throw Error('有试次字段超过40个');for(const [k,v] of Object.entries(t)){if(Array.isArray(v)&&v.length>500)throw Error(k+' 数组太长');if(typeof v==='string'&&v.length>2000)throw Error(k+' 字符串太长')}}};
D.submit=async({exp,group,pid,trials,test=false})=>{
 D.validateTrials(trials);const payload={project:project(),experiment:(test?'test_':'')+exp,condition:group,participant:pid,trials:trials.map(t=>Object.fromEntries(Object.entries(t).filter(([_,v])=>v!==null&&v!==undefined)))};
 const bytes=new Blob([JSON.stringify(payload)]).size;if(bytes>256*1024)throw Error(`数据体积${(bytes/1024).toFixed(0)}KB超过256KB`);
 if(!D.hasProject())return{ok:false,draft:true,payload,error:'尚未填写真实项目码。请先将本地数据保存备用。'};
 const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),13000);
 try{const response=await fetch(API()+'/api/hw2/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ac.signal});let json=await response.json();if(!response.ok||!json.ok)throw Error(json.msg||`HTTP ${response.status}`);return{...json,bytes,payload};}
 catch(e){return{ok:false,error:e.message,payload,bytes}}finally{clearTimeout(timer)}
};
D.localKey='lab_records_v1';
D.loadLocal=()=>{try{return JSON.parse(U.safeStorage.get(D.localKey)||'[]')}catch(_){return []}};
D.saveLocal=(rec)=>{let all=D.loadLocal();let at=all.findIndex(z=>z.id===rec.id);if(at===-1)all.push(rec);else all[at]=rec;U.safeStorage.set(D.localKey,JSON.stringify(all));};
D.exportLocal=()=>{let records=D.loadLocal();let flat=records.flatMap(r=>r.trials.map((t,i)=>({...t,participant:r.pid,experiment:(r.test?'test_':'')+r.exp,condition:r.group,trial_index:i+1,uploaded:r.uploaded})));U.download('attention_lab_local_trials.csv','\ufeff'+U.csv(flat),'text/csv;charset=utf-8')};
D.exportBackup=rec=>U.download('attention_lab_backup_'+rec.exp+'_'+rec.pid+'.json',JSON.stringify(rec,null,2));
D.toSummary=(rows,exp,includeTest=false)=>{let selected=rows.filter(r=>D.experimentBase(r.experiment)===exp&&(includeTest||D.isFormal(r)));const taskNames=exp==='change'?['cue','neutral']:exp==='map'?['ego','world']:['global','focus'];let groups=exp==='change'?['all']:['A','B'];let output=[];
 for(let group of groups)for(let task of taskNames){let items=selected.filter(r=>(exp==='change'||(r.group||r.condition||'').toUpperCase().startsWith(group))&&String(r.task)==task);let rt=items.filter(r=>r.correct===true||r.correct===1||r.correct==='1'||String(r.correct).toLowerCase()==='true').map(r=>Number(r.rt_ms??r.rt)).filter(Number.isFinite);
   let nPeople=new Set(items.map(x=>x.participant).filter(Boolean)).size;let k=items.filter(r=>r.correct===true||r.correct===1||r.correct==='1'||String(r.correct).toLowerCase()==='true').length;
   output.push({group,task,n:items.length,people:nPeople,accuracy:items.length?k/items.length:null,rt:U.mean(rt)});
 }return output;
};
D.pairedChange=(rows)=>{let by={};for(const r of rows){if(D.experimentBase(r.experiment)!=='change'||!D.isFormal(r)||!r.participant)continue;((by[r.participant]??=[])).push(r)}let vals=[];
 for(const [pid,items] of Object.entries(by)){let s=D.toSummary(items,'change');let cue=s.find(z=>z.task==='cue'),neutral=s.find(z=>z.task==='neutral');if(cue&&neutral&&Number.isFinite(cue.rt)&&Number.isFinite(neutral.rt)){vals.push({pid,rt_gain:neutral.rt-cue.rt,acc_gain:cue.accuracy-neutral.accuracy})}}
 return vals;
};
D.parseCSV=text=>{let rows=[],field='',record=[],quoted=false;for(let i=0;i<text.length;i++){let ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++}else if(ch==='"')quoted=false;else field+=ch}else if(ch==='"')quoted=true;else if(ch===','){record.push(field);field=''}else if(ch==='\n'){record.push(field.replace(/\r$/,''));rows.push(record);record=[];field=''}else field+=ch}if(field||record.length){record.push(field);rows.push(record)}let keys=rows.shift()?.map(x=>x.replace(/^\ufeff/,''))||[];return rows.filter(r=>r.length).map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])))};
window.LabData=D;
})();
