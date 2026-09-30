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
  interviews.forEach(v=>INTERVIEWS.push({...v,artist:profile.id}));
  if(video)VIDEOS[profile.id]=video;
  books.forEach(b=>BOOKS.push({...b,artist:profile.id}));
}
/* 모든 작가 파일을 읽은 뒤 한 번 호출: 정렬 + 관리자 변경 반영 */
function finishArtists(){
  const d=s=>s.replaceAll(".","");
  INTERVIEWS.sort((x,y)=>d(y.date).localeCompare(d(x.date)));
  BOOKS.sort((x,y)=>y.year-x.year);
  adApply();
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
];
const galById=Object.fromEntries(GALLERIES.map(g=>[g.id,g]));

/* 전시 (모두 예시) */
const EXHIBITIONS = [
  {g:"gyeongin", title:"획의 시간", artists:["sjw"], kind:"초대전", start:"2026-09-18", end:"2026-10-12", desc:"한글 궁체와 판본체를 바탕으로 한 근작 30점과 전각 12방을 함께 소개한다."},
  {g:"gyeongin", title:"하루 한 장", artists:["rhj"], kind:"개인전", start:"2025-05-10", end:"2025-06-08", desc:"1년 동안 하루 한 장씩 그린 골목 드로잉 365점 중 120점."},
  {g:"lamer", title:"골목의 오후", artists:["rhj"], kind:"개인전", start:"2026-10-21", end:"2026-10-27", desc:"그림책 『골목의 오후』 원화와 새 드로잉 40점."},
  {g:"lamer", title:"번짐", artists:["jmr"], kind:"개인전", start:"2021-11-03", end:"2021-11-28", desc:"수묵담채 소품 30점으로 꾸린 첫 개인전."},
  {g:"insaart", title:"수평의 시간", artists:["hsy"], kind:"개인전", start:"2026-09-10", end:"2026-10-18", desc:"같은 수평선을 스무 번 넘게 다시 그린 신작 18점. 오전과 오후, 흐린 날과 맑은 날의 차이가 한 벽에 나란히 걸린다."},
  {g:"insaart", title:"한글, 획으로 서다", artists:["sjw"], kind:"초대전", start:"2023-10-05", end:"2023-11-12", desc:"훈민정음 해례본 서문을 여러 서체로 다시 쓴 연작."},
  {g:"insaplaza", title:"청회", artists:["oeb"], kind:"개인전", start:"2026-11-04", end:"2026-11-17", desc:"청회색 유약 항아리와 잔 20점."},
  {g:"insaplaza", title:"어긋난 격자", artists:["pjo"], kind:"개인전", start:"2025-03-01", end:"2025-03-30", desc:"격자 목판을 스무 가지 색 순서로 찍은 에디션 연작."},
  {g:"topo", title:"새벽 남산", artists:["cjs"], kind:"개인전", start:"2026-09-23", end:"2026-10-06", desc:"새벽 안개 속 남산 능선을 그린 수묵담채 신작 15점."},
  {g:"topo", title:"물때", artists:["hsy"], kind:"개인전", start:"2024-06-05", end:"2024-07-07", desc:"썰물과 밀물 시간에 맞춰 그린 수평선 연작의 시작."},
  {g:"gwanhoon", title:"먹의 호흡", artists:["jmr"], kind:"개인전", start:"2026-09-01", end:"2026-09-27", desc:"한지에 먹을 여러 번 스며들게 한 수묵 대작 12점."},
  {g:"gwanhoon", title:"2026 청년작가전", artists:["hsy","knr","rhj"], kind:"그룹전", start:"2026-08-12", end:"2026-09-06", desc:"올해 주목할 청년작가 세 명의 회화·미디어·드로잉을 한자리에 모았다."},
  {g:"gana", title:"무게의 문법", artists:["mjh"], kind:"개인전", start:"2026-10-08", end:"2026-11-22", desc:"폐목재와 콘크리트 블록으로 쌓은 설치 작업을 전시 공간에 맞춰 새로 쌓는다."},
  {g:"gana", title:"땅의 연대기 이후", artists:["ysg"], kind:"개인전", start:"2027-01-12", end:"2027-03-07", desc:"회고전 이후 새로 그린 흙빛 색면 회화 20점."},
  {g:"sungkok", title:"여섯 개의 방", artists:["hsy","mjh","ldh","jmr","pjo","knr"], kind:"기획전", start:"2026-11-05", end:"2026-12-20", desc:"장르가 다른 작가 여섯 명이 각자 방 하나씩을 맡아 꾸미는 기획전."},
  {g:"sungkok", title:"기울어진 탑", artists:["mjh"], kind:"개인전", start:"2025-05-02", end:"2025-06-15", desc:"쌓는 과정 자체를 전시장에서 공개한 설치전."},
  {g:"mmca", title:"신호 없는 채널", artists:["knr"], kind:"개인전", start:"2026-12-03", end:"2027-01-31", desc:"방송이 끝난 뒤의 노이즈 화면을 재료로 한 4채널 영상과 인터랙티브 설치."},
  {g:"mmca", title:"화면 밖", artists:["knr"], kind:"그룹전", start:"2023-09-01", end:"2023-10-15", desc:"스크린 바깥으로 나온 영상 설치를 모은 그룹전."},
  {g:"hanmi", title:"밤의 입자", artists:["ldh"], kind:"개인전", start:"2026-09-24", end:"2026-10-26", desc:"새벽 세 시의 도시를 장노출로 기록한 연작 24점. 필름 입자가 드러나는 대형 프린트."},
  {g:"hanmi", title:"도시의 온도", artists:["ldh"], kind:"그룹전", start:"2024-08-01", end:"2024-08-31", desc:"도시의 밤을 기록하는 사진가들의 그룹전."},
  {g:"sema", title:"땅의 연대기", artists:["ysg"], kind:"회고전", start:"2025-03-04", end:"2025-06-01", desc:"1970년대 단색 추상부터 2025년 신작까지 55년의 작업을 정리한 회고전."},
  {g:"hakgojae", title:"찍힌 자리", artists:["pjo"], kind:"개인전", start:"2026-10-20", end:"2026-11-30", desc:"한 판을 여러 색으로 겹쳐 찍은 다색 목판화와 목판 원판을 함께 전시한다."},
  {g:"hakgojae", title:"남산 사십 년", artists:["cjs"], kind:"초대전", start:"2024-04-10", end:"2024-05-26", desc:"사십 년 동안 오른 경주 남산을 그린 실경산수 40점."},
  {g:"hyundai", title:"흘러내린 자리", artists:["oeb"], kind:"개인전", start:"2026-10-15", end:"2026-11-09", desc:"장작가마에서 유약이 흘러내린 자국을 그대로 남긴 달항아리 16점."},
  {g:"hyundai", title:"달, 기울다", artists:["oeb"], kind:"개인전", start:"2025-04-01", end:"2025-04-27", desc:"비대칭 달항아리 연작 첫 공개."},
].map(e=>({...e,venue:galById[e.g].name,region:galById[e.g].area}));

/* ---------- generative artwork ---------- */
function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
const IMG={};function photo(src){if(!IMG[src]){const im=new Image();im.src=src;IMG[src]=im}return IMG[src]}
function paintPhoto(cv,artist,key){
  const ctx=cv.getContext("2d"),W=cv.width,H=cv.height,m=/^w(\d+)$/.exec(key),cm=/^c(\d+)$/.exec(key);
  const idx=m?+m[1]:cm?+cm[1]:hash(key)%artist.photos.length, im=photo(artist.photos[idx%artist.photos.length]);
  const draw=()=>{ctx.fillStyle=artist.pal[0];ctx.fillRect(0,0,W,H);if(!im.naturalWidth)return;
    const contain=!!m, s=contain?Math.min(W/im.naturalWidth,H/im.naturalHeight)*.88:Math.max(W/im.naturalWidth,H/im.naturalHeight);
    const w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.drawImage(im,(W-w)/2,(H-h)/2,w,h)};
  draw();if(!im.complete||!im.naturalWidth)im.addEventListener("load",draw,{once:true});
}
function paint(cv, artist, key){
  if(artist.photos)return paintPhoto(cv,artist,key);
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
function artCanvas(artist,key,w,h,label){const c=document.createElement("canvas");c.width=w;c.height=h;c.setAttribute("role","img");c.setAttribute("aria-label",label||artist.name+" 작품");paint(c,artist,key);return c}

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
function posterCanvas(ex,w,h){
  const a=byId[ex.artists[0]],c=document.createElement("canvas");c.width=w;c.height=h;c.setAttribute("role","img");c.setAttribute("aria-label",`「${ex.title}」 전시 포스터`);
  const ctx=c.getContext("2d");ctx.fillStyle=a.pal[0];ctx.fillRect(0,0,w,h);
  const art=document.createElement("canvas");art.width=w;art.height=h*.62;paint(art,a,"poster"+ex.title);ctx.drawImage(art,0,0);
  const dark=["neon","grain"].includes(a.style);ctx.fillStyle=dark?"#F2F2F2":"#161616";
  const names=ex.artists.length>2?`${byId[ex.artists[0]].name} 외 ${ex.artists.length-1}인`:ex.artists.map(id=>byId[id].name).join(" · ");
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
const exOfGal=gid=>EXHIBITIONS.filter(e=>e.g===gid).map(e=>({...e,st:status(e)}));
const sameDay=(a,b)=>a.getTime()===b.getTime();
const runningOn=d=>EXHIBITIONS.filter(e=>parse(e.start)<=d&&d<=parse(e.end));
function weekStart(d){const k=(d.getDay()+6)%7;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-k)}
const NOTICES=[
  {date:"2026.09.30",tag:"공지",title:"arttan 홈페이지 초안을 공개했어요",body:"작가 포트폴리오, 인터뷰, 도록, 갤러리, 전시일정을 한곳에서 보는 arttan의 첫 초안이에요. 정명희 작가 외의 작가·전시 정보는 예시예요."},
  {date:"2026.09.29",tag:"안내",title:"작가 등록 신청은 이렇게 해요",body:"위쪽의 '작가 등록' 버튼으로 신청하면 운영팀이 확인한 뒤 승인해요. 분류(원로·중견·청년)는 나이를 기준으로 정하고, 필요하면 조정해요."},
  {date:"2026.09.28",tag:"업데이트",title:"정명희 작가 아카이브를 열었어요",body:"한국예술디지털아카이브(DA-Arts) 미술작가 500人 자료를 바탕으로 작품 11점과 개인전 17건을 정리했어요."},
  {date:"2026.09.28",tag:"안내",title:"arttan 주소는 www.arttan.co.kr 이에요",body:"art(미술)와 灘(여울 탄)을 합친 이름이에요."}];


/* ---------- 관리자 저장소 (사이트·관리자 공용) ---------- */
const AD_KEY="arttan.admin.v1";
const AD_DEF=()=>({artists:[],exhibitions:[],edits:{},hidden:{},done:{},apps:[
  {id:"ap1",name:"서하늘",born:1997,genre:"사진",city:"서울",date:"2026.09.29",note:"개인전 2회"},
  {id:"ap2",name:"민도윤",born:1972,genre:"조각",city:"강원 춘천",date:"2026.09.28",note:"개인전 9회 · 공공미술 3건"},
  {id:"ap3",name:"윤채원",born:1990,genre:"판화",city:"대구",date:"2026.09.27",note:"개인전 3회"}]});
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
  ARTISTS.forEach(a=>a.hidden=!!AD.hidden[a.id]);
  AD.exhibitions.forEach(e=>{if(!EXHIBITIONS.some(x=>x.id===e.id)&&galById[e.g]&&e.artists.every(id=>byId[id]))EXHIBITIONS.push({...e,venue:galById[e.g].name,region:galById[e.g].area,added:true})});
}
const noticeList=()=>AD.notices||NOTICES;
