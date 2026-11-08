/* W8 地图实验。A=北向主图+航向小图，B=航向主图+北向小图。 */
(function(){'use strict';
const M={};
const COLORS={land:'#e8ece5',road:'#ffffff',river:'#bedce1',park:'#bed8bd',accent:'#e5a648',car:'#1c66ad',dest:'#c83b3b',text:'#23405a'};
const LANDMARKS=['图书馆','食堂','教学楼','体育馆','科技楼','礼堂','校医院','实验楼'];
// 0° 北；90° 东。物体从世界坐标变换到地图的屏幕坐标。
function project(east,north,head,mode){if(mode==='north')return [east,-north];let a=head*Math.PI/180;return [east*Math.cos(a)-north*Math.sin(a),-(east*Math.sin(a)+north*Math.cos(a))]}
function drawMap(ctx,x,y,w,h,trial,mode,compact=false){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#e8eee8';ctx.fillRect(x,y,w,h);
  const scale=Math.min(w/740,h/520),cx=x+w/2,cy=y+h/2;const center=(e,n)=>{let v=project(e,n,trial.heading,mode);return [cx+v[0]*scale,cy+v[1]*scale]};
  function quad(e,n,rx,ry,color){let p=center(e,n);ctx.fillStyle=color;ctx.fillRect(p[0]-rx*scale,p[1]-ry*scale,rx*2*scale,ry*2*scale)}
  // 绘制旋转道路网格：以世界坐标各道路为基准，航向上旋转整幅地图。
  const line=(coords,width,color)=>{ctx.beginPath();coords.forEach(([e,n],i)=>{let p=center(e,n);if(i)ctx.lineTo(...p);else ctx.moveTo(...p)});ctx.lineWidth=width*scale;ctx.strokeStyle=color;ctx.stroke()};
  for(let e=-450;e<=450;e+=110){line([[e,-380],[e,380]],30,'#c3d2d8');line([[e,-380],[e,380]],22,COLORS.road);line([[e,-380],[e,380]],1,'#d7e1e4')}
  for(let n=-440;n<=440;n+=110){line([[-550,n],[550,n]],30,'#c3d2d8');line([[-550,n],[550,n]],22,COLORS.road);line([[-550,n],[550,n]],1,'#d7e1e4')}
  for(let e=-330;e<330;e+=110){for(let n=-330;n<330;n+=110){const id=((e+330)/110)*7+(n+330)/110;quad(e+55,n+55,27,25,id%6===0?'#afcfae':'#d8ddcd')}}
  line([[-600,260],[-100,260],[40,330],[540,340]],37,COLORS.river);
  let labels=[[-222,150,'博物馆'],[270,160,'教学区'],[-270,-220,'公园'],[230,-190,'体育场']];if(!compact){labels.forEach(([e,n,t])=>{let p=center(e,n);ctx.font=`${Math.max(8,11*scale)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#678391';ctx.fillText(t,...p)})}
  let pos=center(0,0); // 车头箭头；北向上中随方向旋转，航向上始终向上。
  ctx.save();ctx.translate(...pos);ctx.rotate((mode==='north'?trial.heading:0)*Math.PI/180);ctx.fillStyle=COLORS.car;ctx.beginPath();let s=Math.max(6,12*scale);ctx.moveTo(0,-s*1.35);ctx.lineTo(s*.85,s);ctx.lineTo(0,s*.6);ctx.lineTo(-s*.85,s);ctx.closePath();ctx.fill();ctx.restore();
  let tar=center(trial.targetE,trial.targetN);ctx.shadowColor='#e96e6e';ctx.shadowBlur=8;ctx.fillStyle=COLORS.dest;ctx.beginPath();ctx.arc(tar[0],tar[1],Math.max(5,7*scale),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(!compact){ctx.font=`bold ${Math.max(10,13*scale)}px sans-serif`;ctx.fillStyle=COLORS.text;ctx.textAlign='center';ctx.fillText(trial.landmark,tar[0],tar[1]-14*scale);}
  // 正北方向罗盘
  const ccx=x+w-29,ccy=y+32,compAngle=(mode==='north'?0:-trial.heading)*Math.PI/180;ctx.save();ctx.translate(ccx,ccy);ctx.rotate(compAngle);ctx.fillStyle='#365973';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(5,8);ctx.lineTo(0,5);ctx.lineTo(-5,8);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#365973';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('N',ccx+Math.sin(compAngle)*19,ccy-Math.cos(compAngle)*19);
  ctx.restore();ctx.strokeStyle='#5b748650';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2)
}
M.generate=(id,task)=>{const rand=U.rng(U.seed('map_v1_'+id));const heading=[0,45,90,135,180,225,270,315,90,180][id%10];const landmark=LANDMARKS[id%LANDMARKS.length];let delta=([60,-60,75,-75,90,-90,45,-45,70,-70][id%10]);let targetE,targetN,correct;
  if(task==='ego'){let az=(heading+delta)*Math.PI/180;targetE=Math.sin(az)*165;targetN=Math.cos(az)*165;correct=delta>0?'ArrowRight':'ArrowLeft'}
  else{let cardinal=id%4;const e=[0,175,0,-175],n=[175,0,-175,0];targetE=e[cardinal];targetN=n[cardinal];correct=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][cardinal]}
  return {id,task,heading,targetE:U.round(targetE,3),targetN:U.round(targetN,3),landmark,correct,viewOffset:rand()};
};
M.draw=(canvas,trial,group)=>{const c=canvas.getContext('2d');const W=960,H=520;canvas.width=W;canvas.height=H;
  const big=group==='A'?'north':'track',small=group==='A'?'track':'north';
  c.fillStyle='#142a3b';c.fillRect(0,0,W,H);drawMap(c,24,48,712,444,trial,big,false);drawMap(c,750,69,186,157,trial,small,true);
  c.fillStyle='#e4d19d';c.font='bold 18px sans-serif';c.textAlign='left';c.fillText(big==='north'?'北向上 · 主地图':'航向上 · 主地图',24,29);c.fillStyle='#d2e1ea';c.font='14px sans-serif';c.fillText(small==='north'?'北向上 · 辅助':'航向上 · 辅助',753,55);
  c.fillStyle='#aec6d9';c.font='13px sans-serif';c.fillText('● 蓝色箭头：当前位置和前进方向',752,268);c.fillText('● 红点：题目所指地标',752,294);c.fillText('两张地图显示相同的道路与位置',752,333);
  c.fillStyle='#d6e6ef';c.fillText('相对判断以车头方向为准',752,363);c.fillText('世界方向以地理北为准',752,386);c.fillText('注意：右上方指北针可用于定向',752,416);
};
M.drawPractice=(canvas,trial,group)=>M.draw(canvas,trial,group);
window.MapExp=M;
})();
