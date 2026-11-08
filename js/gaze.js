/* 眼动引擎。视频只在用户浏览器内交给 WebGazer；服务器只接收稀疏屏幕坐标。 */
(function(){'use strict';
const G={mode:'unset',ready:false,quality:null,active:false,samples:[],buf:[],last:null,lastSample:0,focusLost:0,calibrating:false};
let loading=null;let overlays=[];const $=U.$;
function loader(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('脚本加载失败：'+url));document.head.append(s)})}
G.load=async()=>{if(window.webgazer)return; if(!loading){loading=(async()=>{try{await loader(LAB_CONFIG.LOCAL_WEBGAZER_URL)}catch(_){await loader(LAB_CONFIG.WEBGAZER_URL)} if(!window.webgazer)throw Error('WebGazer未初始化')})()}return loading};
G.chooseFallback=(type='bubble')=>{G.mode=type;G.ready=true;G.quality={mode:type,err_px:null,hz:null,face_loss:null,valid:false,reason:'非摄像头模式'};U.safeStorage.set('lab_gaze_mode',type);G.detachOverlay();if(G.active)G.stop().catch(console.error);return G.quality};
G.start=async()=>{if(G.active)return;await G.load();let wg=window.webgazer;
  // WebGazer 3.5.3 的默认值 ./mediapipe/face_mesh 需要网站自行托管完整模型。
  // 本静态项目没有该目录，故必须在 begin() 之前指定完整 MediaPipe 模型资源地址。
  // 不能仅让 WebGazer.js 加载成功就视为眼动追踪已经启动。
  if(!wg.params || typeof wg.params!=='object')throw new Error('WebGazer版本不兼容：缺少params');
  wg.params.faceMeshSolutionPath=LAB_CONFIG.MEDIAPIPE_FACE_MESH_URL;
  wg.setGazeListener((p,t)=>{const now=performance.now();if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)) {G.last={x:p.x,y:p.y,t:now};G.buf.push(G.last);if(G.buf.length>360)G.buf.shift()} if(G.recording&&G.last&&now-G.lastSample>=LAB_CONFIG.GAZE_SAMPLE_MS){G.lastSample=now;G.recordCandidate(G.last.x,G.last.y,now)} });
  if(wg.showPredictionPoints)wg.showPredictionPoints(false);
  if(wg.showFaceOverlay)wg.showFaceOverlay(false);
  if(wg.showFaceFeedbackBox)wg.showFaceFeedbackBox(false);
  if(wg.showVideoPreview)wg.showVideoPreview(true);
  await wg.begin();G.active=true;
  // 禁用实验期间的自动鼠标训练，避免被试点击目标破坏校准。
  if(wg.removeMouseEventListeners)wg.removeMouseEventListeners();
};
G.stop=async()=>{G.stopRecording();try{if(window.webgazer&&G.active){await window.webgazer.end()}}catch(_){ }G.active=false};
G.markMouse=(e)=>{G.lastMouse={x:e.clientX,y:e.clientY,t:performance.now()};if(G.recording&&G.mode!=='eye'&&performance.now()-G.lastSample>=LAB_CONFIG.GAZE_SAMPLE_MS){G.lastSample=performance.now();G.recordCandidate(e.clientX,e.clientY,G.lastSample)}};
G.recordCandidate=(clientX,clientY,now)=>{if(!G.canvas)return;const b=G.canvas.getBoundingClientRect();if(b.width<1||b.height<1)return;const nx=(clientX-b.left)/b.width,ny=(clientY-b.top)/b.height;if(nx>=0&&nx<=1&&ny>=0&&ny<=1){G.samples.push({x:nx,y:ny,t:Math.max(0,now-G.recordStart)});if(G.samples.length>110){ // 均匀稀疏化，而不是丢掉后半段
G.samples=G.samples.filter((_,i)=>i%2===0);G.lastSample=now-100;
}}};
G.startRecording=(canvas)=>{G.canvas=canvas;G.samples=[];G.recordStart=performance.now();G.lastSample=0;G.recording=true;G.focusLost=0;G.unfocus=()=>{G.focusLost++};window.addEventListener('blur',G.unfocus);canvas.addEventListener('pointermove',G.markMouse)};
G.stopRecording=()=>{G.recording=false;try{G.canvas?.removeEventListener('pointermove',G.markMouse);window.removeEventListener('blur',G.unfocus)}catch(_){}const s=G.samples;G.samples=[];G.canvas=null;return {gaze_x:s.map(z=>Math.round(z.x*1000)),gaze_y:s.map(z=>Math.round(z.y*1000)),gaze_t:s.map(z=>Math.round(z.t)),gaze_n:s.length,focus_lost:G.focusLost}};
G.renderBubble=(stage)=>{G.detachOverlay();if(G.mode!=='bubble')return;const d=U.el('div','stage-overlay');stage.append(d);const move=e=>{const b=stage.getBoundingClientRect();d.style.setProperty('--mx',`${(e.clientX-b.left)/b.width*100}%`);d.style.setProperty('--my',`${(e.clientY-b.top)/b.height*100}%`)};stage.addEventListener('pointermove',move);overlays=[stage,d,move]};
G.detachOverlay=()=>{if(overlays.length){const [stage,d,move]=overlays;stage.removeEventListener('pointermove',move);d.remove();overlays=[]}};
function overlay(title,help){let old=$('.calibration-overlay');if(old)old.remove();const el=U.el('section','calibration-overlay');el.innerHTML=`<div class="calibration-note"><div class="eyebrow">WEBCAM · CALIBRATION</div><h2>${U.esc(title)}</h2><p>${U.esc(help)}</p></div><button type="button" class="btn secondary calibration-exit" id="calCancel">取消并切换鼠标模式</button><div class="calibration-meter" id="calProgress">准备中</div>`;document.body.append(el);return el}
function dot(el,x,y,value,handler){let b=U.el('button','calibration-dot',String(value??''));b.type='button';b.style.left=x+'%';b.style.top=y+'%';b.addEventListener('click',handler);el.append(b);return b}
G.calibrate=async()=>{if(G.calibrating)return false;G.calibrating=true;let root=overlay('九点眼动校准','保持头部稳定，注视金色圆点，随后点击圆点5次。每点完成后自动进入下一点。');let cancelled=false;
const cancel=()=>{cancelled=true;G.chooseFallback('bubble')};$('#calCancel',root).onclick=cancel;
try{
  await G.start();if(cancelled)return false;
  if(window.webgazer.clearData)await window.webgazer.clearData();
  const positions=U.shuffle([10,50,90].flatMap(y=>[9,50,91].map(x=>({x,y}))),U.rng(8429));
  for(let i=0;i<positions.length&&!cancelled;i++){
    const p=positions[i];$('#calProgress',root).textContent=`校准点 ${i+1}/9 · 共45次点击`;
    await new Promise(resolve=>{let n=0;let b=dot(root,p.x,p.y,5,()=>{if(cancelled){b.remove();resolve();return}const bb=b.getBoundingClientRect(),x=bb.left+bb.width/2,y=bb.top+bb.height/2;
      try{window.webgazer.recordScreenPosition?.(x,y,'click')}catch(_){ }
      n++;b.textContent=String(5-n);if(n>=5){b.remove();resolve()}
    });let watch=setInterval(()=>{if(cancelled){clearInterval(watch);b.remove();resolve()}},200);});
  }
  if(cancelled)return false;
  $('.calibration-note',root).innerHTML='<div class="eyebrow">VALIDATION · 05 POINTS</div><h2>五点验证</h2><p>只需注视金色圆点，不要点击。程序将测量预测落点误差。</p>';
  const targets=[{x:50,y:50},{x:20,y:20},{x:80,y:20},{x:20,y:80},{x:80,y:80}];let all=[],lost=0,total=0;
  for(let i=0;i<targets.length&&!cancelled;i++){
    let p=targets[i],b=dot(root,p.x,p.y,'•',()=>{});b.disabled=true;b.classList.add('read-only');$('#calProgress',root).textContent=`验证点 ${i+1}/5 · 注视约1.8秒`;
    const start=performance.now();await U.sleep(1800);const relevant=G.buf.filter(s=>s.t>=start+600&&s.t<=performance.now());let vals=relevant.map(s=>Math.hypot(s.x-innerWidth*p.x/100,s.y-innerHeight*p.y/100));all.push(vals.length?U.median(vals):null);lost+=vals.length===0?1:0;total+=relevant.length;b.remove();
  }
  if(cancelled)return false;
  let valid=all.filter(Number.isFinite),err=U.mean(valid),hz=total/(targets.length*1.2);let ok=valid.length>=3&&err<=LAB_CONFIG.GAZE_VALIDATION_LIMIT_PX;
  G.quality={mode:'eye',err_px:U.round(err,1),hz:U.round(hz,1),face_loss:lost/5,valid:ok,points_valid:valid.length,point_errors:all};
  let answer=await new Promise(resolve=>{root.innerHTML=`<div class="panel" style="max-width:570px;margin:20px"><div class="eyebrow">校准质量报告</div><h2>${ok?'✓ 校准通过':'⚠ 建议重新校准'}</h2><div class="result-metrics"><div class="metric"><span>平均误差</span><b>${U.fmt(err,0)} px</b></div><div class="metric"><span>有效点位</span><b>${valid.length}/5</b></div><div class="metric"><span>估计频率</span><b>${U.fmt(hz,1)} Hz</b></div></div><p class="muted small">阈值200px；网页眼动只适合较大兴趣区域。误差过高会将数据标记低质量，不能据此推断精确注视点。</p><div class="row-actions"><button type="button" class="btn" id="calAccept">${ok?'开始实验':'仍然继续（低质量）'}</button><button type="button" class="btn secondary" id="calRetry">重新校准</button><button type="button" class="btn ghost" id="calFallback">改用模糊揭示</button></div></div>`;$('#calAccept',root).onclick=()=>resolve('accept');$('#calRetry',root).onclick=()=>resolve('retry');$('#calFallback',root).onclick=()=>resolve('fallback')});
  if(answer==='retry'){root.remove();G.calibrating=false;return G.calibrate()}
  if(answer==='fallback'){G.chooseFallback('bubble');return false}
  G.mode='eye';G.ready=true;G.quality.low_quality=!ok;try{window.webgazer.showVideoPreview?.(false)}catch(_){ }return true;
}catch(e){console.error('Eye tracking:',e);G.chooseFallback('bubble');window.Lab?.toast('摄像头眼动不可用，已改用模糊揭示模式');return false}
finally{root.remove();G.calibrating=false}
};
window.Gaze=G;
})();
