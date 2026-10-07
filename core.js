/* arttan core — 사이트(index.html)와 관리자(admin.html)가 함께 쓰는 데이터와 그리기 함수 */
/* 최종 분류 */
const TIERS = [["전체",null],["원로","원로작가"],["중견","중견작가"],["청년","청년작가"]];
const GENRES = ["서양화","한국화","서예·문인화","조각","판화","사진","공예·도예","뉴미디어","설치·복합매체","드로잉·일러스트"];

/* genre: 대표 장르 1개 · more: 부가 장르(최대 2) · tags: 세부 분류 */
/* 작가 데이터는 artists/<작가id>/artist.js 에 작가별로 따로 있어요.
   각 파일이 registerArtist()로 자기 자료만 등록하고, 여기서는 모으기만 해요. */
const ARTISTS=[];const byId={};const INTERVIEWS=[];const VIDEOS={};const BOOKS=[];
function registerArtist(a){
  if(!a||!a.id){console.warn("id 없는 작가 데이터는 건너뛰어요",a);return}
  if(byId[a.id]){console.warn(`작가 id가 겹쳐요: ${a.id} — 나중 파일은 건너뛰어요`);return}
  const {interviews=[],video=null,books=[],...profile}=a;
  if(profile.pubs){profile.books=profile.pubs;delete profile.pubs}
  profile.works=(profile.works||[]).slice();
  ARTISTS.push(profile);byId[profile.id]=profile;
  /* 인터뷰·도록은 항상 이 작가 것으로 묶어요 (다른 작가와 섞이지 않게) */
  interviews.forEach((v,k)=>INTERVIEWS.push({...v,id:v.id||`${profile.id}-iv${k+1}`,artist:profile.id}));
  if(video)VIDEOS[profile.id]=video;
  books.forEach((b,k)=>BOOKS.push({...b,id:b.id||`${profile.id}-b${k+1}`,artist:profile.id}));
}
/* 모든 작가 파일을 읽은 뒤 한 번 호출: 정렬 + 관리자 변경 반영 */
function finishArtists(){
  adApply();
  const d=s=>s.replaceAll(".","");
  INTERVIEWS.sort((x,y)=>d(y.date).localeCompare(d(x.date)));
  BOOKS.sort((x,y)=>(y.year||0)-(x.year||0));
}

const genresOf = a=>[a.genre,...(a.more||[])];
const pub=()=>ARTISTS.filter(a=>!a.hidden);



/* 인터뷰 영상 (실제 사이트에서는 유튜브·비메오 주소를 넣어요) */

const videoOf=a=>VIDEOS[a.id]||(a.real?null:{title:`작업실에서 만난 ${a.name}`,len:`${4+hash(a.id)%6}:${String(hash(a.name)%60).padStart(2,"0")}`,date:"2026.07",place:a.city+" 작업실"});



/* 갤러리 (이름·동네만 표기. 주소·관람시간은 실제 정보 확인 후 입력) */
const GALLERIES = [
  {id:"gyeongin", name:"경인미술관", area:"인사동"},
  {id:"lamer", name:"라메르갤러리", area:"인사동"},
  {id:"insaart", name:"인사아트센터", area:"인사동"},
  {id:"insaplaza", name:"인사아트프라자", area:"인사동"},
  {id:"topo", name:"토포하우스", area:"인사동"},
  {id:"gwanhoon", name:"관훈갤러리", area:"인사동"},
  {id:"gana", name:"가나아트센터", area:"평창동"},
  {id:"sungkok", name:"성곡미술관", area:"신문로"},
  {id:"mmca", name:"국립현대미술관", area:"삼청동"},
  {id:"hanmi", name:"한미사진뮤지엄", area:"삼청동"},
  {id:"sema", name:"서울시립미술관", area:"서소문"},
  {id:"hakgojae", name:"학고재갤러리", area:"삼청동"},
  {id:"hyundai", name:"현대갤러리", area:"삼청동"},
  /* 작가 전시 기록에서 확인한 곳 */
  {id:"dmma", name:"대전시립미술관", area:"대전"},
  {id:"jmhm", name:"정명희미술관", area:"대전", addr:"대전평생학습관 302호"},
  {id:"cbcc", name:"충북문화관 숲속갤러리", area:"청주"},
  /* 테스트용 가상 갤러리 (엘로이 샘플 전시용) */
  {id:"testgal", test:true, name:"arttan 테스트 갤러리", area:"인사동", photo:"galleries/testgal-3.jpg", intro:"기능 시험용 가상 갤러리예요. 실제 장소가 아니에요. 사진은 AI로 생성한 샘플이에요."},
];
const galById=Object.fromEntries(GALLERIES.map(g=>[g.id,g]));

/* 전시 (주소가 바뀌지 않게 id 를 꼭 적어요. 출처로 확인한 실제 전시만 넣어요. 단, id가 eloi- 로 시작하는 것은 테스트용 가상 전시예요. g: 갤러리 id — 목록에 없는 곳은 GALLERIES에 먼저 추가) */
const EXHIBITIONS = [
  {id:"eloi-2026", g:"testgal", title:"빛이 머무는 자리", artists:["eloi"], kind:"개인전", start:"2026-11-01", end:"2026-11-07", poster:"artists/eloi/posters/2026-light-3.jpg", desc:"[테스트용 가상 전시] 방 안으로 들어온 오후의 빛을 과슈와 색연필로 그린 일러스트 신작 8점. 전시·포스터·도록 기능을 시험하려고 만든 샘플이에요."},
  {id:"eloi-2025", g:"testgal", title:"정원의 오후", artists:["eloi"], kind:"개인전", start:"2025-05-03", end:"2025-05-25", poster:"artists/eloi/posters/2025-garden-3.jpg", desc:"[테스트용 가상 전시] 서울의 작은 정원과 오후 햇살을 그린 일러스트 작가 엘로이의 첫 개인전 (샘플)."},
  {id:"ex01", g:"cbcc", title:"이홍원 작은 그림전 – 마동 30년 기념특별전", artists:["lhw"], kind:"특별전", start:"2025-03-11", end:"2025-03-16", desc:"청주 마동창작마을에서 작업한 30년을 기념해 충북문화관 숲속갤러리 전관에서 연 작은 그림전. 꽃 호랑이, 소나무, 싸움소, 질주, 연리지, 울림 등을 선보였다."},
  {id:"ex02", g:"insaplaza", title:"이홍원 전 – 달항아리 노래", artists:["lhw"], kind:"기획 초대전", start:"2023-03-22", end:"2023-03-27", desc:"서울 인사아트프라자갤러리 기획 초대전."},
  {id:"ex03", g:"jmhm", title:"물, 예술을 넘어", artists:["jmh"], kind:"소장전", start:"2023-02-06", end:"2023-06-30", desc:"대청댐 건설로 고향을 잃은 수몰민의 애환을 담은 작품들. 제4회 겸재미술상 수상기념전에 걸렸던 작품을 다시 소개했다."},
  {id:"ex04", g:"jmhm", title:"한 장의 편지 – 한 숟가락의 물", artists:["jmh"], kind:"소장전", start:"2022-02-07", end:"2022-06-30", desc:"'금강 아리랑, 이 한잔의 물'을 부제로, 물과 고향을 주제로 한 작품을 모은 소장전."},
  {id:"ex05", g:"dmma", title:"금강홍 열두가지 변주", artists:["jmh"], kind:"초대전", start:"2016-06-14", end:"2016-06-19", desc:"대전시립미술관 초대전."},
].map((e,i)=>({id:"ex"+String(i+1).padStart(2,"0"),...e,venue:galById[e.g].name,region:galById[e.g].area}));

/* 전시리뷰 (전시장 스케치): 전시 하나에 리뷰 하나 이상. 현장 사진·리뷰 글·전시에 걸린 작품을 담아요.
   photos: [{src, caption}] — 직접 찍었거나 사용을 허락받은 사진만. works: [[작가id, 작품번호(0부터)], …]
   id 가 eloi- 로 시작하는 것은 테스트용 샘플이에요. */
const REVIEWS = [
  {id:"eloi-garden", exhibition:"eloi-2025", title:"오후의 빛이 머무는 방 — 「정원의 오후」 스케치", date:"2025-05-10", author:"arttan 편집부",
   body:"[테스트용 샘플 리뷰예요. 전시리뷰 기능을 시험하려고 만든 글이고, 실제 전시가 아니에요. 사진은 AI로 생성했어요.]\n\n인사동 골목 안쪽, 유리창에 커다란 정원 그림 배너가 걸린 작은 전시장이 보여요. 20대 일러스트 작가 엘로이의 첫 개인전 「정원의 오후」는 과슈와 색연필로 그린 일상의 풍경으로 채워졌어요.\n\n흰 벽에는 액자 속 그림들이 눈높이에 나란히 걸려 있어요. 나무 그늘 아래 책을 읽는 사람, 물 위에 누워 떠 있는 사람, 새벽빛이 들어온 작은 방. 모두 하루 중 빛이 가장 오래 머무는 순간을 붙잡은 장면이에요.\n\n대표작 「정원의 오후」 앞에서 작가는 관람객과 한참 이야기를 나눴어요. 전시장 한쪽 진열대에는 스케치북과 색 견본이 놓여 있어, 그림 한 장이 완성되기까지의 과정을 엿볼 수 있었어요.",
   photos:[
     {src:"artists/eloi/reviews/garden-01-3.jpg", caption:"인사동 골목의 전시장 입구 — 창에 걸린 전시 배너"},
     {src:"artists/eloi/reviews/garden-02-3.jpg", caption:"전시장 전경"},
     {src:"artists/eloi/reviews/garden-03-3.jpg", caption:"대표작 「정원의 오후」 옆에 선 작가"},
     {src:"artists/eloi/reviews/garden-04-3.jpg", caption:"작품 앞에서 오래 머무는 관람객"},
     {src:"artists/eloi/reviews/garden-05-3.jpg", caption:"가까이에서 본 「물결 위의 원」"},
     {src:"artists/eloi/reviews/garden-06-3.jpg", caption:"오프닝 날, 관람객과 이야기를 나누는 작가"},
     {src:"artists/eloi/reviews/garden-07-3.jpg", caption:"스케치북과 색 견본을 모은 진열대"}],
   works:[["eloi",1],["eloi",2],["eloi",3]],
   /* 영상: [{url, title}] — 유튜브·비메오 주소. 없으면 칸이 안 보여요 */
   videos:[],
   /* 이 전시의 작가 인터뷰는 '인터뷰'(작가 파일의 interviews)에 exhibition 으로 연결해요 */
   },
];

/* ---------- generative artwork ---------- */
function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
const IMG={};function photo(src){if(!IMG[src]){const im=new Image();im.src=src;IMG[src]=im}return IMG[src]}
function paintPhoto(cv,artist,key,pics,focus){
  pics=pics||artist.photos;const [fx,fy]=focus||[.5,.5];
  const ctx=cv.getContext("2d"),W=cv.width,H=cv.height,m=/^w(\d+)$/.exec(key),cm=/^c(\d+)$/.exec(key);
  const idx=m?+m[1]:cm?+cm[1]:hash(key)%pics.length, im=photo(optImg(pics[idx%pics.length]));
  const draw=()=>{ctx.fillStyle=artist.pal[0];ctx.fillRect(0,0,W,H);if(!im.naturalWidth)return;
    const contain=!!m, s=contain?Math.min(W/im.naturalWidth,H/im.naturalHeight)*.88:Math.max(W/im.naturalWidth,H/im.naturalHeight);
    const w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.drawImage(im,contain?(W-w)/2:(W-w)*fx,contain?(H-h)/2:(H-h)*fy,w,h)};
  draw();if(!im.complete||!im.naturalWidth)im.addEventListener("load",draw,{once:true});
}
function paint(cv, artist, key){
  if(artist.photos)return paintPhoto(cv,artist,key);
  /* 작품 사진이 없는 실제 작가는 인물 사진으로 (예시 그림을 만들지 않아요) */
  if(artist.portraits)return paintPhoto(cv,artist,key.replace(/^w/,"p"),artist.portraits,artist.portraitFocus);
  const ctx=cv.getContext("2d"), W=cv.width, H=cv.height, r=rng(hash(artist.id+key)), P=artist.pal;
  const pick=()=>P[Math.floor(r()*P.length)];
  ctx.save();
  switch(artist.style){
    case "bands":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);
      const hz=H*(.35+r()*.3);
      let g=ctx.createLinearGradient(0,0,0,hz);g.addColorStop(0,P[2]);g.addColorStop(1,P[3]);ctx.fillStyle=g;ctx.fillRect(0,0,W,hz);
      g=ctx.createLinearGradient(0,hz,0,H);g.addColorStop(0,P[1]);g.addColorStop(1,P[4]);ctx.fillStyle=g;ctx.fillRect(0,hz,W,H-hz);
      for(let i=0;i<40;i++){ctx.globalAlpha=.05+r()*.08;ctx.fillStyle=pick();const y=r()*H;ctx.fillRect(0,y,W,1+r()*H*.03)}
      ctx.globalAlpha=.9;ctx.fillStyle=P[3];ctx.fillRect(0,hz-1,W,2);break}
    case "blocks":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);
      let y=H*.92;const cx=W*(.4+r()*.2);
      ctx.fillStyle="rgba(0,0,0,.08)";ctx.fillRect(W*.1,y,W*.8,H*.02);
      for(let i=0;i<5+Math.floor(r()*3);i++){const bw=W*(.18+r()*.3),bh=H*(.06+r()*.12);const x=cx-bw/2+(r()-.5)*W*.12;y-=bh;
        ctx.fillStyle=P[1+Math.floor(r()*4)];ctx.fillRect(x,y,bw,bh);ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(x,y,bw,bh*.15)}
      break}
    case "grain":{
      const g=ctx.createLinearGradient(0,0,W*r(),H);g.addColorStop(0,P[0]);g.addColorStop(.55,P[1]);g.addColorStop(.85,P[2]);g.addColorStop(1,P[3]);
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      for(let i=0;i<6;i++){const x=r()*W,y=r()*H*.8,rad=W*(.02+r()*.06);const rg=ctx.createRadialGradient(x,y,0,x,y,rad*4);rg.addColorStop(0,"rgba(255,220,180,.8)");rg.addColorStop(1,"rgba(255,220,180,0)");ctx.fillStyle=rg;ctx.fillRect(x-rad*4,y-rad*4,rad*8,rad*8)}
      const img=ctx.getImageData(0,0,W,H),d=img.data;for(let i=0;i<d.length;i+=4){const n=(r()-.5)*46;d[i]+=n;d[i+1]+=n;d[i+2]+=n}ctx.putImageData(img,0,0);break}
    case "ink":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);
      for(let i=0;i<3+Math.floor(r()*3);i++){const x=W*(.2+r()*.6),y=H*(.2+r()*.6),rad=W*(.12+r()*.25);
        const rg=ctx.createRadialGradient(x,y,rad*.1,x,y,rad);rg.addColorStop(0,"rgba(20,20,20,.75)");rg.addColorStop(.6,"rgba(20,20,20,.25)");rg.addColorStop(1,"rgba(20,20,20,0)");ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,rad,0,7);ctx.fill()}
      ctx.strokeStyle="rgba(20,20,20,.85)";ctx.lineCap="round";
      for(let i=0;i<2;i++){ctx.lineWidth=W*(.01+r()*.025);ctx.beginPath();const sx=r()*W,sy=r()*H;ctx.moveTo(sx,sy);ctx.bezierCurveTo(r()*W,r()*H,r()*W,r()*H,r()*W,r()*H);ctx.stroke()}
      ctx.fillStyle=P[3];ctx.fillRect(W*(.7+r()*.15),H*(.75+r()*.1),W*.05,W*.05);break}
    case "brush":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);ctx.lineCap="round";ctx.lineJoin="round";
      const cols=2+Math.floor(r()*2),cw=W/(cols+1);
      for(let c=0;c<cols;c++){const x0=W-cw*(c+1);let y=H*.1;
        while(y<H*.78){ctx.strokeStyle=P[1];ctx.globalAlpha=.8+r()*.2;ctx.lineWidth=W*(.02+r()*.03);ctx.beginPath();
          if(r()<.5){ctx.moveTo(x0-cw*.3,y);ctx.quadraticCurveTo(x0,y+(r()-.5)*H*.02,x0+cw*.3,y+H*.01)}else{ctx.moveTo(x0+(r()-.5)*cw*.3,y-H*.02);ctx.quadraticCurveTo(x0+(r()-.5)*cw*.2,y+H*.04,x0+(r()-.5)*cw*.3,y+H*.09)}
          ctx.stroke();y+=H*(.04+r()*.05)}}
      ctx.globalAlpha=1;ctx.fillStyle=P[3];ctx.fillRect(W*.1,H*.82,W*.08,W*.08);ctx.fillStyle=P[0];ctx.fillRect(W*.12,H*.82+W*.02,W*.04,W*.012);break}
    case "vessel":{
      const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,P[0]);g.addColorStop(1,P[4]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      const cx=W*.5+(r()-.5)*W*.06,cy=H*.52,rw=W*(.28+r()*.06),rh=H*(.28+r()*.04),tilt=(r()-.5)*.08;
      ctx.fillStyle="rgba(0,0,0,.12)";ctx.beginPath();ctx.ellipse(cx,cy+rh*1.02,rw*.9,rh*.08,0,0,7);ctx.fill();
      const rg=ctx.createRadialGradient(cx-rw*.35,cy-rh*.35,rw*.1,cx,cy,rw*1.2);rg.addColorStop(0,P[1]);rg.addColorStop(.7,P[2]);rg.addColorStop(1,P[3]);
      ctx.fillStyle=rg;ctx.beginPath();ctx.ellipse(cx,cy,rw,rh,tilt,0,7);ctx.fill();
      ctx.fillStyle=P[2];ctx.fillRect(cx-rw*.3,cy-rh*1.05,rw*.6,rh*.12);
      ctx.strokeStyle="rgba(93,111,115,.5)";ctx.lineCap="round";
      for(let i=0;i<4+Math.floor(r()*4);i++){const x=cx-rw*.7+r()*rw*1.4;ctx.lineWidth=W*(.004+r()*.01);ctx.beginPath();ctx.moveTo(x,cy-rh*.7);ctx.lineTo(x+(r()-.5)*6,cy+rh*(.1+r()*.5));ctx.stroke()}
      break}
    case "lines":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);ctx.lineCap="round";
      for(let i=0;i<60;i++){ctx.strokeStyle=r()<.08?P[3]:P[1];ctx.globalAlpha=.15+r()*.5;ctx.lineWidth=.6+r()*1.8;ctx.beginPath();
        const x=r()*W,y=r()*H;ctx.moveTo(x,y);ctx.bezierCurveTo(x+(r()-.5)*W*.5,y+(r()-.5)*H*.3,x+(r()-.5)*W*.5,y+(r()-.5)*H*.3,x+(r()-.5)*W*.6,y+(r()-.5)*H*.4);ctx.stroke()}
      ctx.globalAlpha=.9;ctx.strokeStyle=P[1];ctx.lineWidth=2;
      for(let i=0;i<5;i++){const x=W*(.15+r()*.6),y=H*(.3+r()*.5),w=W*(.08+r()*.18),h=H*(.1+r()*.2);ctx.strokeRect(x,y-h,w,h)}
      break}
    case "grid":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);const n=4+Math.floor(r()*3),m=Math.round(n*H/W),cw=W/n,ch=H/m;
      for(let i=0;i<n;i++)for(let j=0;j<m;j++){if(r()<.55){ctx.globalAlpha=.85;ctx.fillStyle=pick();const o=(r()-.5)*cw*.08;ctx.fillRect(i*cw+cw*.08+o,j*ch+ch*.08+o,cw*.84,ch*.84)}}
      ctx.globalAlpha=1;ctx.strokeStyle=P[3];ctx.lineWidth=Math.max(2,W*.006);
      for(let i=1;i<n;i++){ctx.beginPath();ctx.moveTo(i*cw+(r()-.5)*4,0);ctx.lineTo(i*cw+(r()-.5)*4,H);ctx.stroke()}
      for(let j=1;j<m;j++){ctx.beginPath();ctx.moveTo(0,j*ch);ctx.lineTo(W,j*ch+(r()-.5)*6);ctx.stroke()}break}
    case "neon":{
      ctx.fillStyle=P[0];ctx.fillRect(0,0,W,H);
      for(let y=0;y<H;y+=4){ctx.fillStyle=`rgba(255,255,255,${r()*.05})`;ctx.fillRect(0,y,W,2)}
      for(let i=0;i<5+Math.floor(r()*5);i++){ctx.shadowColor=ctx.fillStyle=P[1+Math.floor(r()*4)];ctx.shadowBlur=W*.04;const y=r()*H;ctx.globalAlpha=.9;ctx.fillRect(r()*W*.3,y,W*(.3+r()*.6),H*(.004+r()*.02))}
      ctx.shadowBlur=0;ctx.globalAlpha=1;break}
  }
  ctx.restore();
}
function artCanvas(artist,key,w,h,label){const c=document.createElement("canvas");c.width=w;c.height=h;c.setAttribute("role","img");c.setAttribute("aria-label",label||artist.name+" 작품");paint(c,artist,key);
  /* 인물 사진은 얼굴 위치(portraitFocus)를 기준으로 잘라요 — 넓은 배너에서도 얼굴이 잘리지 않게 */
  if(!artist.photos&&artist.portraits){const [fx,fy]=artist.portraitFocus||[.5,.5];c.style.objectPosition=`${fx*100}% ${fy*100}%`}
  return c}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2600)}
const DOW="일월화수목금토";
const parse=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const fmt=d=>`${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} (${DOW[d.getDay()]})`;
const today=(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())})();
function status(ex){const s=parse(ex.start),e=parse(ex.end);if(today<s){const dd=Math.round((s-today)/864e5);return{k:"soon",label:`예정 · D-${dd}`}}if(today>e)return{k:"end",label:"종료"};const left=Math.round((e-today)/864e5);return{k:"live",label:left<=7?`진행중 · ${left}일 남음`:"진행중"}}
function chip(label,n,on,onClick){const b=document.createElement("button");b.type="button";b.className="chip"+(n===0?" zero":"");b.setAttribute("aria-pressed",on);b.innerHTML=`${esc(label)}<span class="n">${n}</span>`;b.onclick=onClick;return b}


/* ---------- 공통: 포스터 · 표지 · 전시 ---------- */
/* 전시 포스터: 작가·갤러리가 준 포스터 이미지(ex.poster)가 있으면 그걸, 없으면 작품으로 만든 포스터 */
function posterCanvas(ex,w,h){
  if(ex.poster){const im=document.createElement("img");im.src=optImg(ex.poster,w<=480);im.alt=`「${ex.title}」 전시 포스터`;im.loading="lazy";im.decoding="async";
    im.width=w;im.height=h;im.style.cssText="width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;display:block";return im}
  /* 등록된 작가가 없는 전시(수집한 전시 등)는 차분한 기본 색으로 그려요 */
  const a=byId[ex.artists[0]]||{id:"ex-"+(ex.id||ex.title),pal:["#EEEAF6","#3B2A6B","#8B7BB8","#D9CFEF","#1E1636"],style:"lines"},c=document.createElement("canvas");c.width=w;c.height=h;c.setAttribute("role","img");c.setAttribute("aria-label",`「${ex.title}」 전시 포스터`);
  const ctx=c.getContext("2d");ctx.fillStyle=a.pal[0];ctx.fillRect(0,0,w,h);
  const art=document.createElement("canvas");art.width=w;art.height=h*.62;paint(art,a,"poster"+ex.title);ctx.drawImage(art,0,0);
  const dark=["neon","grain"].includes(a.style);ctx.fillStyle=dark?"#F2F2F2":"#161616";
  const names=exNames(ex)||ex.venue;
  ctx.font=`700 ${w*.1}px Hahmlet, serif`;ctx.fillText(ex.title,w*.07,h*.74,w*.86);
  ctx.font=`500 ${w*.05}px "IBM Plex Sans KR", sans-serif`;ctx.fillText(names,w*.07,h*.81,w*.86);
  ctx.font=`400 ${w*.042}px "IBM Plex Mono", monospace`;ctx.fillText(`${ex.start.replaceAll("-",".")} – ${ex.end.slice(5).replace("-",".")}`,w*.07,h*.88,w*.86);
  ctx.font=`400 ${w*.042}px "IBM Plex Sans KR", sans-serif`;ctx.fillText(ex.venue,w*.07,h*.94,w*.86);
  return c}

function coverCanvas(bk,w,h){
  const a=byId[bk.artist];const c=document.createElement("canvas");c.width=w;c.height=h;c.setAttribute("role","img");c.setAttribute("aria-label",`도록 「${bk.title}」 표지`);
  const ctx=c.getContext("2d");ctx.fillStyle=a.pal[0];ctx.fillRect(0,0,w,h);
  const art=document.createElement("canvas");art.width=w*.76;art.height=h*.52;paint(art,a,"cover");ctx.drawImage(art,w*.12,h*.12);
  const dark=["neon","grain"].includes(a.style);ctx.fillStyle=dark?"#F2F2F2":"#161616";
  ctx.font=`500 ${w*.085}px Hahmlet, serif`;ctx.fillText(bk.title,w*.12,h*.76);
  ctx.font=`400 ${w*.045}px "IBM Plex Sans KR", sans-serif`;ctx.fillText(a.name,w*.12,h*.83);
  ctx.font=`400 ${w*.036}px "IBM Plex Mono", monospace`;ctx.fillText(String(bk.year),w*.12,h*.92);
  return c}
/* ---------- 검색 노출: 페이지 주소 · 노출 기준 · 제목 (사이트·관리자·서버 공용) ---------- */
const SITE_URL="https://www.arttan.co.kr";
const artistPath=id=>`/artist/${encodeURIComponent(id)}`;
const workPath=(id,i)=>`${artistPath(id)}/work/${i+1}`;
const galPath=id=>`/gallery/${encodeURIComponent(id)}`;
const exPath=e=>`/exhibition/${encodeURIComponent(e.id)}`;
/* 실제 작가와 그 작가의 전시만 검색에 노출해요. 예시 작가·예시 전시는 노출하지 않아요. */
const artistIndexable=a=>!!(a&&a.real&&!a.hidden);
const exIndexable=e=>!!(e&&e.id&&e.artists.some(id=>artistIndexable(byId[id])));
const galIndexable=g=>!!g&&!g.test&&(!!(g.addr||g.intro)||EXHIBITIONS.some(e=>e.g===g.id&&exIndexable(e)));
/* 참여 작가 이름: arttan 에 등록된 작가 + 등록되지 않은 작가(artists_text, 쉼표로 구분) */
const exPeople=e=>[...e.artists.map(id=>byId[id]?.name).filter(Boolean),...String(e.artistsText||"").split(/[,·]/).map(s=>s.trim()).filter(Boolean)];
function exNames(e){const n=exPeople(e);return n.length>2?`${n[0]} 외 ${n.length-1}인`:n.join("·")}
/* 전시 제목은 사람들이 검색하는 순서로: 작가 개인전 : 「전시명」 - 장소 */
const exHeadline=e=>`${exNames(e)} ${e.kind||"전시"} : 「${e.title}」 - ${e.venue}`;
/* 검색 제목: 사람들이 찾는 "이름 + 작가"를 맨 앞에 → "엘로이 작가 (1992~) · 서양화 청년작가" */
const artistHeadline=a=>`${a.name} 작가${a.born?` (${a.born}~)`:""} · ${a.genre} ${a.tier}`;
/* 사이트에 함께 올린 작품 사진(artists/…/*.jpg)은 배포 때 WebP(1200px·480px)로도 만들어 둬요 */
const optImg=(src,small)=>/^\/?(artists|galleries)\/[^?]+\.jpe?g$/i.test(src||"")?src.replace(/\.jpe?g$/i,small?"-480.webp":".webp"):src;
/* ---------- 작가 인터뷰: 영상·사진·글 (넣은 것만 보여요) ---------- */
const interviewPath=v=>`/interview/${encodeURIComponent(v.id)}`;
const ivIndexable=v=>!!v&&artistIndexable(byId[v.artist]);
const ytId=u=>(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(u||"")||[])[1];
const ivParts=v=>({video:!!(v.video&&(v.video.src||v.video.url)),photos:(v.photos||[]).length>0,text:!!(v.lead||v.body||(v.qa||[]).length)});
/* 대표 이미지: 사진 → 영상 첫 화면 → 유튜브 썸네일 순 */
/* 인터뷰 대표 이미지: 영상이 있으면 영상 장면(포스터·유튜브 썸네일)을 먼저, 없으면 첫 사진 */
function ivCoverSrc(v,small){
  if(v.video){if(v.video.poster)return optImg(v.video.poster,small);const y=ytId(v.video.url||v.video.src);if(y)return `https://i.ytimg.com/vi/${y}/hqdefault.jpg`}
  if(v.photos&&v.photos[0])return optImg(v.photos[0].src,small);return null}
/* 영상: 유튜브·비메오는 넣어서 재생, 영상 파일(mp4 등)은 사이트 플레이어로 (다운로드 메뉴는 숨겨요) */
function videoHtml(vd,title){if(!vd)return "";if(typeof vd==="string")vd={url:vd};const src=vd.src||vd.url||"";const emb=videoEmbed(src);
  if(emb)return `<div class="gs-video${videoTall(src)?" tall":""}"><iframe src="${emb}" title="${esc(title||vd.title||"영상")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(src))return `<div class="gs-video"><video controls playsinline preload="metadata" controlslist="nodownload" disablepictureinpicture oncontextmenu="return false"${vd.poster?` poster="${esc(optImg(vd.poster))}"`:""}><source src="${esc(src)}" type="video/${/\.webm/i.test(src)?"webm":"mp4"}"></video></div>`;
  return src?`<p><a class="btn ghost" href="${esc(src)}" target="_blank" rel="noopener">${esc(vd.title||"영상 보기")} ↗</a></p>`:""}

/* ---------- 전시리뷰 ---------- */
const reviewPath=r=>`/review/${encodeURIComponent(r.id)}`;
const reviewsOfEx=exId=>REVIEWS.filter(r=>r.exhibition===exId&&!r.hidden);
const reviewIndexable=r=>!!r&&!r.hidden&&exIndexable(EXHIBITIONS.find(e=>e.id===r.exhibition));
/* 리뷰에 나오는 작가: 전시 참여 작가 + 실린 작품의 작가 */
function reviewArtists(r){const e=EXHIBITIONS.find(x=>x.id===r.exhibition);return [...new Set([...(e?e.artists:[]),...(r.works||[]).map(w=>w[0])])].filter(id=>byId[id])}
/* 소식: 자주하는 질문은 '공지사항'에 구분 "자주하는 질문"으로 넣어요 */
const FAQ_TAG="자주하는 질문";
const isFaq=n=>n.tag===FAQ_TAG;
const newsNotices=()=>noticeList().filter(n=>!isFaq(n));
const faqList=()=>noticeList().filter(isFaq);

/* ---------- 도록 · 화집 · 작가 저서 ----------
   도록 데이터: {id, kind, title, year, pages, size, publisher, isbn, writer, desc,
     cover(표지 사진), spreads[펼침면 사진], full(전체 공개 여부), works[이 작가 작품 번호(0부터)],
     exhibition(전시 id), toc[목차], links[{name,url}]}
   표지 사진이 없으면 글자로 만든 표지를 보여줘요 (다른 곳의 이미지를 가져오지 않아요). */
const BOOK_KINDS=["전시 도록","화집","작가 저서"];
/* 인터뷰 종류 (관리자에서 고르면 인터뷰 목록에 분류 칩이 생겨요) */
const IV_KINDS=["작업실 방문","전시 인터뷰","대담","서면 인터뷰"];
const ivDateKey=v=>String(v.date||"").replace(/\D/g,"").padEnd(8,"0");
/* 서점 구매 버튼: 예스24 · 교보문고 · 쿠팡. ISBN이 있으면 ISBN으로, 없으면 「제목 + 작가」로 서점 검색에 연결해요.
   관리자 '구매·열람처'에 서점 상품 주소를 직접 넣으면 그 주소를 써요. 판매하지 않는 전시 도록은 ISBN이 없으면 숨겨요 (bk.buy 로 직접 켜고 끌 수 있어요) */
const BUY_SHOPS=[["yes24","예스24",/예스24|yes24/i,q=>`https://www.yes24.com/Product/Search?domain=BOOK&query=${q}`],
  ["kyobo","교보문고",/교보|kyobo/i,q=>`https://search.kyobobook.co.kr/search?keyword=${q}&gbCode=TOT&target=total`],
  ["coupang","쿠팡",/쿠팡|coupang|coupa\.ng/i,q=>`https://www.coupang.com/np/search?q=${q}&channel=user`]];
function bookBuyable(bk,a){if(bk.buy===false)return false;if(bk.buy===true)return true;if(a&&a.real===false)return false;return !!bk.isbn||bk.kind!=="전시 도록"}
function buyLinks(bk,a){if(!bookBuyable(bk,a))return [];
  const q=encodeURIComponent(bk.isbn?bk.isbn.replace(/[^0-9Xx]/g,""):`${bk.title} ${a?a.name:""}`.trim());
  return BUY_SHOPS.map(([k,name,re,f])=>{const m=(bk.links||[]).find(x=>re.test(x.name+" "+x.url));return {k,name,url:m?m.url:f(q),direct:!!m}})}
/* 수수료(제휴) 링크인지: 쿠팡 파트너스 등. 제휴 링크가 있으면 대가성 안내 문구를 꼭 함께 보여줘요 (공정위 표시광고 지침) */
const isAffiliate=u=>/link\.coupang\.com|coupa\.ng|[?&](ttbkey|partner|affiliate)=/i.test(u||"");
const AFF_NOTE="이 링크로 구매하시면 arttan이 판매처로부터 일정액의 수수료를 받을 수 있어요. (쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)";
/* 구매 버튼과 겹치는 서점 링크는 일반 링크 목록에서 빼요 */
const otherLinks=bk=>(bk.links||[]).filter(x=>!BUY_SHOPS.some(([,,re])=>re.test(x.name+" "+x.url)));
const bookPath=b=>`/book/${encodeURIComponent(b.id)}`;
const bookAccess=b=>b.spreads&&b.spreads.length?(b.full?"e북 열람":"미리보기"):"정보만";
const bookIndexable=b=>!!b&&artistIndexable(byId[b.artist])&&!!(b.cover||(b.desc&&b.desc.length>=40)||(b.spreads&&b.spreads.length)||(b.works&&b.works.length));
/* 국립중앙도서관 소장 검색 (제목으로 찾기) */
const libSearch=b=>`https://www.nl.go.kr/NL/contents/search.do?kwd=${encodeURIComponent(b.title)}`;
function bookCover(b,small){
  if(b.cover){const im=document.createElement("img");im.src=optImg(b.cover,small);im.alt=`『${b.title}』 표지`;im.loading="lazy";im.className="bk-img";return im}
  const a=byId[b.artist]||{},P=a.pal||["#EEEAF6","#3B2A6B","#8B7BB8","#D9CFEF","#1E1636"];
  const d=document.createElement("div");d.className="bk-typo";d.setAttribute("role","img");d.setAttribute("aria-label",`『${b.title}』 표지 (글자 표지)`);
  /* 책마다 작가 색 중 하나를 골라요. 밝은 바탕이면 글자를 어둡게 */
  const bg=[P[1],P[3],P[2],P[4]][hash(b.id||b.title)%4],lum=(h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255})(bg);
  d.style.cssText=`background:${bg};color:${lum>.6?"#1A1A1A":"#F7F4EE"}`;
  d.innerHTML=`<span class="k">${esc(b.kind||"도록")}</span><b>${esc(b.title)}</b><span class="a">${esc(a.name||"")}</span><span class="y">${b.year||""}</span>`;
  return d}
/* 전시장 대표 사진: 전시장이 허락한 사진(g.photo)만 써요. 없으면 이름으로 만든 카드 */
function galCover(g,small){
  if(g.photo){const im=document.createElement("img");im.src=optImg(g.photo,small);im.alt=`${g.name} 전경`;im.loading="lazy";im.decoding="async";im.className="g-photo";return im}
  const d=document.createElement("div");d.className="g-typo";d.setAttribute("role","img");d.setAttribute("aria-label",`${g.name} (사진 준비 중)`);
  d.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M3 21h18"/></svg><span>전시장 사진 준비 중</span>`;return d}
/* 영상 주소 → 넣어서 볼 수 있는 주소 (유튜브·비메오) */
/* 영상 주소 → 사이트 안에서 재생하는 주소. 유튜브(일반·쇼츠·라이브), 비메오, 인스타그램(게시물·릴스), 페이스북 영상 */
function videoEmbed(u){if(!u)return null;let m;
  if((m=/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(u)))return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  if((m=/vimeo\.com\/(?:video\/)?(\d+)/.exec(u)))return `https://player.vimeo.com/video/${m[1]}`;
  if((m=/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/.exec(u)))return `https://www.instagram.com/${m[1]==="reels"?"reel":m[1]}/${m[2]}/embed/`;
  if(/(?:facebook\.com\/.+\/videos\/|facebook\.com\/(?:watch|reel)|fb\.watch\/)/.test(u))return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false`;
  return null}
/* 세로 영상(인스타그램·쇼츠·릴스)은 세로 틀로 보여줘요 */
const videoTall=u=>/instagram\.com|youtube\.com\/shorts\/|facebook\.com\/reel/.test(u||"");
/* arttan 공식 SNS (관리자 → 설정에서 주소를 넣어요. 비어 있으면 버튼이 안 보여요) */
const SNS={instagram:"",facebook:"",youtube:""};
const SNS_META=[["youtube","유튜브","M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"],
  ["instagram","인스타그램","M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM16.5 2h-9A5.5 5.5 0 0 0 2 7.5v9A5.5 5.5 0 0 0 7.5 22h9a5.5 5.5 0 0 0 5.5-5.5v-9A5.5 5.5 0 0 0 16.5 2zm3.7 14.5a3.7 3.7 0 0 1-3.7 3.7h-9a3.7 3.7 0 0 1-3.7-3.7v-9a3.7 3.7 0 0 1 3.7-3.7h9a3.7 3.7 0 0 1 3.7 3.7z"],
  ["facebook","페이스북","M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5v3.4h2.8V22H14v-10.1h2.8l.4-3.4z"]];
const snsList=()=>SNS_META.filter(([k])=>/^https:\/\//.test(SNS[k]||"")).map(([k,label,d])=>({k,label,d,url:SNS[k]}));
function snsHtml(cls="sns"){const L=snsList();if(!L.length)return "";
  return `<nav class="${cls}" aria-label="arttan SNS">${L.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener me" aria-label="arttan ${s.label}" title="arttan ${s.label}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${s.d}" fill="currentColor"/></svg><span>${s.label}</span></a>`).join("")}</nav>`}
/* 검색에 알릴 주소와 내용 요약. 관리자에서 저장한 뒤 바뀐 주소만 골라 네이버에 바로 알려요. */
function seoPages(){const m={"/":"home"};
  ARTISTS.filter(artistIndexable).forEach(a=>{
    m[artistPath(a.id)]=JSON.stringify([a.name,a.en,a.born,a.tier,a.genre,a.more,a.tags,a.line,a.quote,a.bio,a.cv,a.history,a.collections,a.books,a.works.length]);
    /* 작품 페이지는 사진이 있을 때만 노출해요 (글만 있는 얇은 페이지는 빼요) */
    if(a.photos)a.works.forEach((w,i)=>m[workPath(a.id,i)]=JSON.stringify([a.name,w,a.photos[i%a.photos.length]]))});
  EXHIBITIONS.filter(exIndexable).forEach(e=>m[exPath(e)]=JSON.stringify([e.title,e.kind,e.start,e.end,e.g,e.artists,e.desc]));
  BOOKS.filter(bookIndexable).forEach(b=>m[bookPath(b)]=JSON.stringify(b));
  REVIEWS.filter(reviewIndexable).forEach(r=>m[reviewPath(r)]=JSON.stringify(r));
  INTERVIEWS.filter(ivIndexable).forEach(v=>m[interviewPath(v)]=JSON.stringify(v));
  GALLERIES.filter(galIndexable).forEach(g=>m[galPath(g.id)]=JSON.stringify([g,EXHIBITIONS.filter(e=>e.g===g.id&&exIndexable(e)).map(e=>e.id)]));
  return m}
const exOfGal=gid=>EXHIBITIONS.filter(e=>e.g===gid).map(e=>({...e,st:status(e)}));
const sameDay=(a,b)=>a.getTime()===b.getTime();
const runningOn=d=>EXHIBITIONS.filter(e=>parse(e.start)<=d&&d<=parse(e.end));
function weekStart(d){const k=(d.getDay()+6)%7;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-k)}
const NOTICES=[
  {date:"2026.10.06",tag:"공지",title:"세 작가의 공간으로 새로 시작해요",body:"작품 이미지 사용을 허락받은 기산 정명희, 이민구, 이홍원 작가의 공간을 먼저 열었어요. 시안에 넣었던 예시 작가와 예시 전시는 모두 지웠어요. 작가 소개는 공개된 기사와 자료를 바탕으로 arttan이 정리했고, 출처를 작가 공간에 함께 적어 두었어요."},
  {date:"2026.09.29",tag:"안내",title:"작가 등록 신청은 이렇게 해요",body:"위쪽의 '작가 등록' 버튼으로 신청하면 운영팀이 확인한 뒤 승인해요. 작가 공간 개설과 작품 아카이브는 모두 무료예요."},
  {date:"2026.09.28",tag:"안내",title:"arttan 주소는 www.arttan.co.kr 이에요",body:"art(미술)와 灘(여울 탄)을 합친 이름이에요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"작가 등록은 정말 무료인가요?",body:"네. 작가 공간 개설, 작품 아카이브, 전시 이력 정리까지 모두 무료예요. 위쪽의 '작가 등록' 버튼으로 신청하면 arttan이 확인한 뒤 연락드려요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"등록하면 무엇이 만들어지나요?",body:"작가 이름으로 된 개인 공간(www.arttan.co.kr/artist/…)이 생겨요. 작가 소개, 작품, 인터뷰, 도록·저서, 전시 이력, 문의 창이 한 페이지에 정리되고 네이버·구글 검색에도 노출되도록 만들어요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"작품 사진의 저작권은 어떻게 되나요?",body:"작가님이 직접 주시거나 사용을 허락한 사진만 올려요. 다른 사이트의 이미지는 가져오지 않아요. 원하시면 언제든 내리거나 바꿀 수 있고, 저작권은 작가님께 있어요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"정보를 고치거나 작품을 더 올리고 싶어요.",body:"작가 공간 맨 아래의 '문의'에 남겨 주세요. arttan이 확인해서 반영해요. 작품 제목·연도·재료·크기를 함께 보내 주시면 더 빨라요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"전시 소식을 알리고 싶어요.",body:"작가 공간의 '문의'(유형: 전시 제안)로 전시명, 기간, 장소, 포스터를 보내 주세요. 확인한 뒤 전시 일정과 소식에 올려요. 전시가 끝난 뒤에는 현장 사진과 함께 전시리뷰로 남길 수 있어요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"작품 촬영이나 도록 제작도 맡길 수 있나요?",body:"네. 홈 화면의 '촬영·제작 문의'에서 작품 사진 촬영, 전시회 촬영, 영상 촬영·제작, 도록 제작, 전시 기획을 문의할 수 있어요."},
  {date:"2026.10.07",tag:"자주하는 질문",title:"작품을 사고 싶어요.",body:"작가 공간의 '문의'에서 유형을 '작품 구매'로 골라 남겨 주세요. arttan이 작가님께 전달해 드려요."}];


/* ---------- 관리자 저장소 (사이트·관리자 공용) ---------- */
const AD_KEY="arttan.admin.v1";
const AD_DEF=()=>({artists:[],exhibitions:[],edits:{},hidden:{},done:{},apps:[],books:[],bookEdits:{},bookDel:{},galleries:[],galEdits:{},galDel:{},crawled:[],reviews:[],reviewEdits:{},reviewDel:{},heroOff:{},sns:null});
let AD=AD_DEF();
try{const j=JSON.parse(localStorage.getItem(AD_KEY)||"null");if(j)AD=Object.assign(AD_DEF(),j)}catch(e){}
function adSave(){try{localStorage.setItem(AD_KEY,JSON.stringify(AD));return true}catch(e){toast("브라우저 저장 공간이 부족해서 저장하지 못했어요");return false}}
const STYLES=["bands","blocks","grain","ink","grid","neon","brush","vessel","lines"];
const PALS=[["#E9E4DA","#3D5A6C","#A4B8C4","#D9C3A5","#1E2A33"],["#EDE6DC","#7A4B2E","#C79A6B","#2B2622","#C2B8A8"],["#F0EEE8","#2F3B2A","#8FA07F","#C75D3F","#D9CFB8"],["#0E1220","#E0567A","#5AC8E8","#C7F06A","#6A5CFF"]];
function tierOf(born){const age=today.getFullYear()-born;return age>=70?"원로작가":age>=40?"중견작가":"청년작가"}
function makeArtist(o){const k=hash(o.name+o.born);
  return {id:o.id,added:true,real:true,tier:o.tier||tierOf(o.born),name:o.name,genre:o.genre,more:o.more||[],tags:o.tags||[],born:+o.born,city:o.city||"",
    style:STYLES[k%STYLES.length],pal:PALS[k%PALS.length],quote:"",line:"",bio:o.bio||"",cv:[],works:o.works||[],photos:o.photos&&o.photos.length?o.photos:undefined}}
function adApply(){
  AD.artists.forEach(o=>{if(!byId[o.id]){const a=makeArtist(o);ARTISTS.push(a);byId[a.id]=a}});
  Object.entries(AD.edits).forEach(([id,e])=>{if(byId[id])Object.assign(byId[id],e)});
  ARTISTS.forEach(a=>{a.hidden=!!AD.hidden[a.id];if((AD.heroOff||{})[a.id])a.hero=false});
  if(AD.sns)Object.assign(SNS,AD.sns);
  /* 관리자에서 추가·수정·삭제한 전시장 (Supabase 없이 이 브라우저에만 저장할 때) */
  (AD.galleries||[]).forEach(g=>{if(!galById[g.id]){const o={...g,added:true};GALLERIES.push(o);galById[o.id]=o}});
  Object.entries(AD.galEdits||{}).forEach(([id,e])=>{if(galById[id])Object.assign(galById[id],e)});
  Object.keys(AD.galDel||{}).forEach(id=>{const i=GALLERIES.findIndex(g=>g.id===id);if(i>=0){GALLERIES.splice(i,1);delete galById[id]}});
  /* 관리자에서 추가·수정·삭제한 전시리뷰 (Supabase 없이 이 브라우저에만 저장할 때) */
  (AD.reviews||[]).forEach(r=>{if(!REVIEWS.some(x=>x.id===r.id))REVIEWS.push({...r,added:true})});
  Object.entries(AD.reviewEdits||{}).forEach(([id,e])=>{const r=REVIEWS.find(x=>x.id===id);if(r)Object.assign(r,e)});
  for(let i=REVIEWS.length-1;i>=0;i--)if((AD.reviewDel||{})[REVIEWS[i].id])REVIEWS.splice(i,1);
  /* 관리자에서 추가·수정·삭제한 책 (Supabase 없이 이 브라우저에만 저장할 때) */
  (AD.books||[]).forEach(b=>{if(!BOOKS.some(x=>x.id===b.id)&&byId[b.artist])BOOKS.push({...b,added:true})});
  Object.entries(AD.bookEdits||{}).forEach(([id,e])=>{const b=BOOKS.find(x=>x.id===id);if(b)Object.assign(b,e)});
  for(let i=BOOKS.length-1;i>=0;i--)if((AD.bookDel||{})[BOOKS[i].id])BOOKS.splice(i,1);
  AD.exhibitions.forEach(e=>{if(!EXHIBITIONS.some(x=>x.id===e.id)&&galById[e.g]&&e.artists.every(id=>byId[id]))EXHIBITIONS.push({...e,venue:galById[e.g].name,region:galById[e.g].area,added:true})});
}
const noticeList=()=>AD.notices||NOTICES;
