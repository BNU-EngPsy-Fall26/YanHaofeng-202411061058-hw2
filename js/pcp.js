/* W6 接近相容性原则：原版雷达图与增强雷达图；相同的数值生成算法，差别仅在显示编码。 */
(function(){'use strict';
const P={};const NAMES=['心率','收缩压','呼吸','血氧','体温','呼末CO₂'],COLORS=['#e5a266','#76b7e1','#a895db','#69c4a3','#e38b91','#d8c47a'];
P.generate=(id,task)=>{const r=U.rng(U.seed('pcp_matched_'+task+'_'+id));let v=Array.from({length:6},()=>.92+r()*.19);let focus=(id*5+1)%6,abnormal=id%2===0,target=task==='global'?(id*3)%6:focus;
  if(task==='global'){if(abnormal)v[target]=id%4===0?0.66:1.34;else v[target]=1.04+r()*.11}
  else{v[focus]=abnormal?1.34+r()*.12:.88+r()*.26;if(id%3===0&&focus!==2)v[(focus+2)%6]=1.35}
  const correct=abnormal?'KeyF':'KeyJ';return{id,task,values:v.map(x=>U.round(x,3)),focus,abnormal,correct,threshold:1.2,lower:0.78};
};
function polygon(ctx,cx,cy,rad,vals){ctx.beginPath();vals.forEach((v,i)=>{let a=-Math.PI/2+i*Math.PI/3,x=cx+Math.cos(a)*rad*v,y=cy+Math.sin(a)*rad*v;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}
P.draw=(canvas,stim,group)=>{const ctx=canvas.getContext('2d');canvas.width=960;canvas.height=520;const enhanced=group==='B';
  ctx.fillStyle='#eaf0f2';ctx.fillRect(0,0,960,520);ctx.fillStyle='#143149';ctx.fillRect(0,0,960,74);ctx.fillStyle='#f3e4ba';ctx.font='bold 22px sans-serif';ctx.fillText('ICU · 六项生命体征监护',30,46);ctx.fillStyle='#91d1ce';ctx.font='14px sans-serif';ctx.fillText(enhanced?'增强式独立指标编码':'原版整合式雷达图',736,44);
  const cx=475,cy=289,R=173;
  for(const level of [.45,.65,.85,1.0,1.2,1.45]){ctx.save();ctx.setLineDash(level===1.2?[7,5]:[]);polygon(ctx,cx,cy,R/1.5,Array(6).fill(level));ctx.strokeStyle=level===1.2?'#c57e64':'#9bb1be';ctx.lineWidth=level===1.2?2.5:1;ctx.stroke();ctx.restore()}
  for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,ex=cx+Math.cos(a)*R,ey=cy+Math.sin(a)*R;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.strokeStyle='#8ba6b2';ctx.lineWidth=1.3;ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle=enhanced?COLORS[i]:'#2c536f';ctx.font=`bold ${enhanced?17:16}px sans-serif`;ctx.fillText(NAMES[i],cx+Math.cos(a)*(R+40),cy+Math.sin(a)*(R+26));
  }
  polygon(ctx,cx,cy,R/1.5,stim.values);ctx.fillStyle=enhanced?'#5a88b71c':'#2f709e24';ctx.fill();ctx.strokeStyle='#175a86';ctx.lineWidth=3.5;ctx.stroke();
  stim.values.forEach((v,i)=>{let a=-Math.PI/2+i*Math.PI/3,x=cx+Math.cos(a)*R/1.5*v,y=cy+Math.sin(a)*R/1.5*v;ctx.beginPath();ctx.arc(x,y,enhanced?8:5,0,7);ctx.fillStyle=enhanced?COLORS[i]:'#24688b';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();});
  ctx.fillStyle='#405d6c';ctx.font='15px sans-serif';ctx.textAlign='left';ctx.fillText('正常参考：0.78–1.20（相对值）',28,475);
  ctx.fillStyle='#728b9a';ctx.font='13px sans-serif';ctx.fillText('所有指标均按统一量纲的相对正常值显示',28,498);
  // 左侧解释面板不提供答案、不标异常。
  ctx.fillStyle='#dae6eb';ctx.fillRect(26,120,152,174);ctx.fillStyle='#1a4059';ctx.font='bold 16px sans-serif';ctx.fillText('监测面板',45,155);ctx.font='13px sans-serif';ctx.fillText('图形中心：参考基线',45,186);ctx.fillText('虚线：正常上限',45,214);ctx.fillText('所有指标同一标尺',45,243);
  if(enhanced){ctx.fillStyle='#dae6eb';ctx.fillRect(758,122,174,168);ctx.fillStyle='#23445b';ctx.font='bold 15px sans-serif';ctx.fillText('指标颜色图例',772,151);NAMES.forEach((s,i)=>{ctx.fillStyle=COLORS[i];ctx.fillRect(772+(i%2)*81,170+Math.floor(i/2)*32,9,9);ctx.fillStyle='#335363';ctx.font='11px sans-serif';ctx.fillText(s,785+(i%2)*81,180+Math.floor(i/2)*32)})}
};
window.PCPExp=P;
})();
