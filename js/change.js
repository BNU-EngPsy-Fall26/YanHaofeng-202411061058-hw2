/* W5 变化盲：20张原创、程序化交通/公共空间场景；固定240ms/80ms闪烁，提示类别而非答案位置。 */
(function(){'use strict';
const C={};const W=960,H=520;
const CATEGORIES=['交通标志','车辆','行人','店铺招牌','道路设施'];
const PALETTES=[['#cce4ed','#d4e0e8','#c5d5d8'],['#f3d8c4','#dcc5b4','#b7cbd1'],['#b6c9de','#d3d7dc','#cad4d2'],['#c4d7ce','#dad8c6','#b8cbd2']];
function rr(ctx,x,y,w,h,r=6){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function fill(ctx,color,x,y,w,h,r=0){ctx.fillStyle=color;if(r){rr(ctx,x,y,w,h,r);ctx.fill()}else ctx.fillRect(x,y,w,h)}
function line(ctx,pts,color,width){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function text(ctx,str,x,y,size,color,bold=false){ctx.font=`${bold?'700':'500'} ${size}px system-ui, sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(str,x,y)}
function drawSign(ctx,x,y,idx,alter){const options=['P','40','↗','!','BUS','STOP'];fill(ctx,'#52616e',x-4,y+28,8,70);rr(ctx,x-26,y-13,52,48,8);ctx.fillStyle=(idx%3===1?'#e7b852':'#2b719b');ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#f8f4ed';ctx.stroke();text(ctx,alter?'↺':options[idx%6],x,y+16,idx%6===4?13:22,'white',true)}
function drawCar(ctx,x,y,idx,alter){const col=['#e7c784','#597eaf','#ca6e65','#5b9b91','#a2a3ad','#6f849f'][idx%6];fill(ctx,alter?'#f43f76':col,x-36,y-16,72,28,7);fill(ctx,'#aec5ce',x-19,y-29,38,17,5);fill(ctx,'#1a2f3c',x-25,y+6,13,12,4);fill(ctx,'#1a2f3c',x+15,y+6,13,12,4);fill(ctx,'#e6e7d1',x+28,y-10,7,6,2)}
function drawPed(ctx,x,y,idx,alter){let cols=['#6890bc','#a77b9b','#d8a969','#71a58d','#9472a4'];let col=alter?'#fa533f':cols[idx%5];ctx.fillStyle='#ebc59f';ctx.beginPath();ctx.arc(x,y-28,8,0,Math.PI*2);ctx.fill();line(ctx,[[x,y-18],[x,y+16]],col,12);line(ctx,[[x-4,y+12],[x-11,y+37]],'#34455b',5);line(ctx,[[x+4,y+12],[x+12,y+37]],'#34455b',5);line(ctx,[[x-5,y-9],[x-15,y+8]],col,5);line(ctx,[[x+5,y-9],[x+17,y+5]],col,5)}
function drawShop(ctx,x,y,idx,alter){const cs=['#3d7087','#9d756d','#806e9d','#508d7c','#a67c49'];fill(ctx,alter?'#bd4a50':cs[idx%5],x-49,y-26,98,39,4);text(ctx,['书屋','咖啡','药店','餐厅','便利店'][idx%5],x,y+1,16,'#fff',true);fill(ctx,'#b3c4c9',x-40,y+13,80,60,2);for(let s=-1;s<=1;s++)line(ctx,[[x+s*20,y+13],[x+s*20,y+68]],'#f7f3e5',2)}
function drawFacility(ctx,x,y,idx,alter){if(idx%2){fill(ctx,'#5e6c77',x-4,y+5,8,88);fill(ctx,'#253b48',x-16,y-26,32,42,8);['#ec6262','#e8bd56','#68bca0'].forEach((c,i)=>{ctx.beginPath();ctx.fillStyle=(alter&&i===0?'#63c1a3':c);ctx.arc(x,y-17+i*13,5,0,7);ctx.fill()})}else{fill(ctx,'#3e6171',x-21,y-12,42,44,4);fill(ctx,alter?'#fca349':'#f4f5f4',x-16,y-7,32,25,2);text(ctx,'⇦',x,y+14,23,'#1d5268',true)}}
const drawTypes=[drawSign,drawCar,drawPed,drawShop,drawFacility];
C.generate=id=>{const category=id%5;const rand=U.rng(U.seed('change_scene_v2_'+id));const targetIndex=Math.floor(rand()*4);let xs=[173,383,621,832].map(x=>x+Math.round((rand()-.5)*36));let ys=[218,416,351,141,265],dims=[[70,70],[90,64],[55,85],[108,55],[65,85]];let boxes=Array.from({length:5},(_,type)=>xs.map(x=>[x,ys[type],...dims[type]]));return {id,category:CATEGORIES[category],categoryIndex:category,targetIndex,positions:xs,box:boxes[category][targetIndex],seed:U.seed('scene_bg'+id),label:`场景 ${String(id+1).padStart(2,'0')}`,level:Math.floor(id/5)+1}}
C.draw=(canvas,scene,variant)=>{const ctx=canvas.getContext('2d');canvas.width=W;canvas.height=H;const rand=U.rng(scene.seed);const pal=PALETTES[scene.id%4];
  let grad=ctx.createLinearGradient(0,0,0,320);grad.addColorStop(0,pal[0]);grad.addColorStop(1,pal[1]);fill(ctx,grad,0,0,W,520);
  // 建筑街廓与多层窗户
  for(let i=0;i<10;i++){let x=i*108-28,h=137+rand()*116;fill(ctx,i%2?'#b1c5ca':'#c8d0cc',x,290-h,103,h+65);for(let wx=0;wx<3;wx++)for(let wy=0;wy<5;wy++){let yy=300-h+wy*28;fill(ctx,(i+wy)%3===0?'#8cadbf':'#e7ebdf',x+12+wx*29,yy,17,18,2)}}
  fill(ctx,'#a8b5ac',0,330,960,16);fill(ctx,'#788996',0,346,960,174);fill(ctx,'#c8cdd0',0,354,960,35);fill(ctx,'#425b6c',0,390,960,130);
  for(let i=0;i<6;i++){fill(ctx,'#edf1eb',i*169+38,452,95,6,2)}
  // 斑马线、人行道、路灯，不随条件变化
  for(let i=0;i<8;i++){fill(ctx,'#eef1eb',i*36+350,361,24,7)}
  for(let i=0;i<5;i++){let x=90+i*210;fill(ctx,'#638376',x-26,330-55,52,55,12);fill(ctx,'#4d7763',x-16,300-42,32,45,12);fill(ctx,'#66787d',x-3,310,6,42)}
  const listX=scene.positions;
  // 多类线索同时存在。每组目标只有一个，其他项目完全不变。
  // 背景店铺与建筑必须先绘制，交通路牌属于前景物体。
  // 原版按类型顺序绘制，店铺玻璃幕墙会盖住路牌的下半部分，
  // 导致 BUS/STOP/方向箭头在变化盲刺激中不可辨认。
  // 此处只调整图层绘制顺序，保持刺激位置、变化条件和点击判分不变。
  for(const type of [3,1,2,4,0]){
    for(let k=0;k<4;k++){
      const x=listX[k]+((type===1||type===2)?((k%2)*7-4):0);
      const y=[208,421,351,147,269][type];
      const isChanged=(type===scene.categoryIndex&&k===scene.targetIndex&&variant===1);
      drawTypes[type](ctx,x,y,k+scene.id%5,isChanged);
    }
  }
  // 浅色提示牌/场景标签（同一场景两帧完全相同）
  fill(ctx,'#18364a99',16,12,230,35,5);text(ctx,['城市主干道','校区商业街','综合交通枢纽','公共服务街区'][scene.id%4],131,36,16,'#f2f5ed',true);
  fill(ctx,'#d6e1e6',760,15,180,32,4);text(ctx,'道路安全 · 画面监测',850,36,13,'#486175');
};
C.frames=(id)=>{const scene=C.generate(id);const a=document.createElement('canvas'),b=document.createElement('canvas');C.draw(a,scene,0);C.draw(b,scene,1);return {scene,a,b}};
C.correctClick=(scene,nx,ny)=>{const [cx,cy,w,h]=scene.box;const m=15;return nx*W>=cx-w/2-m&&nx*W<=cx+w/2+m&&ny*H>=cy-h/2-m&&ny*H<=cy+h/2+m};
C.outline=(ctx,scene)=>{const [x,y,w,h]=scene.box;ctx.save();ctx.lineWidth=5;ctx.strokeStyle='#f1c36e';ctx.shadowColor='#000';ctx.shadowBlur=7;ctx.strokeRect(x-w/2-12,y-h/2-12,w+24,h+24);ctx.restore()};
window.ChangeExp=C;
})();
