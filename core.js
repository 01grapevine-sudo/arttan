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
  {id:"testgal", test:true, name:"arttan 테스트 갤러리", area:"인사동", intro:"기능 시험용 가상 갤러리예요. 실제 장소가 아니에요."},
];
const galById=Object.fromEntries(GALLERIES.map(g=>[g.id,g]));

/* 전시 (출처로 확인한 실제 전시만 넣어요. 단, id가 eloi- 로 시작하는 것은 테스트용 가상 전시예요. g: 갤러리 id — 목록에 없는 곳은 GALLERIES에 먼저 추가) */
const EXHIBITIONS = [
  {id:"eloi-2026", g:"testgal", title:"빛이 머무는 자리", artists:["eloi"], kind:"개인전", start:"2026-11-01", end:"2026-11-07", poster:"artists/eloi/posters/2026-light.jpg", desc:"[테스트용 가상 전시] 빛과 색이 겹쳐 머무는 순간을 그린 신작 8점. 전시·포스터·도록 기능을 시험하려고 만든 샘플이에요."},
  {id:"eloi-2025", g:"testgal", title:"정원의 오후", artists:["eloi"], kind:"개인전", start:"2025-05-03", end:"2025-05-25", poster:"artists/eloi/posters/2025-garden.jpg", desc:"[테스트용 가상 전시] 오후의 정원을 색면과 곡선으로 옮긴 첫 개인전 (샘플)."},
  {g:"cbcc", title:"이홍원 작은 그림전 – 마동 30년 기념특별전", artists:["lhw"], kind:"특별전", start:"2025-03-11", end:"2025-03-16", desc:"청주 마동창작마을에서 작업한 30년을 기념해 충북문화관 숲속갤러리 전관에서 연 작은 그림전. 꽃 호랑이, 소나무, 싸움소, 질주, 연리지, 울림 등을 선보였다."},
  {g:"insaplaza", title:"이홍원 전 – 달항아리 노래", artists:["lhw"], kind:"기획 초대전", start:"2023-03-22", end:"2023-03-27", desc:"서울 인사아트프라자갤러리 기획 초대전."},
  {g:"jmhm", title:"물, 예술을 넘어", artists:["jmh"], kind:"소장전", start:"2023-02-06", end:"2023-06-30", desc:"대청댐 건설로 고향을 잃은 수몰민의 애환을 담은 작품들. 제4회 겸재미술상 수상기념전에 걸렸던 작품을 다시 소개했다."},
  {g:"jmhm", title:"한 장의 편지 – 한 숟가락의 물", artists:["jmh"], kind:"소장전", start:"2022-02-07", end:"2022-06-30", desc:"'금강 아리랑, 이 한잔의 물'을 부제로, 물과 고향을 주제로 한 작품을 모은 소장전."},
  {g:"dmma", title:"금강홍 열두가지 변주", artists:["jmh"], kind:"초대전", start:"2016-06-14", end:"2016-06-19", desc:"대전시립미술관 초대전."},
].map((e,i)=>({id:"ex"+String(i+1).padStart(2,"0"),...e,venue:galById[e.g].name,region:galById[e.g].area}));

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
function exNames(e){const n=e.artists.map(id=>byId[id]?.name).filter(Boolean);return n.length>2?`${n[0]} 외 ${n.length-1}인`:n.join("·")}
/* 전시 제목은 사람들이 검색하는 순서로: 작가 개인전 : 「전시명」 - 장소 */
const exHeadline=e=>`${exNames(e)} ${e.kind||"전시"} : 「${e.title}」 - ${e.venue}`;
/* 검색 제목: 사람들이 찾는 "이름 + 작가"를 맨 앞에 → "엘로이 작가 (1992~) · 서양화 청년작가" */
const artistHeadline=a=>`${a.name} 작가${a.born?` (${a.born}~)`:""} · ${a.genre} ${a.tier}`;
/* 사이트에 함께 올린 작품 사진(artists/…/*.jpg)은 배포 때 WebP(1200px·480px)로도 만들어 둬요 */
const optImg=(src,small)=>/^\/?artists\/[^?]+\.jpe?g$/i.test(src||"")?src.replace(/\.jpe?g$/i,small?"-480.webp":".webp"):src;
/* ---------- 도록 · 화집 · 작가 저서 ----------
   도록 데이터: {id, kind, title, year, pages, size, publisher, isbn, writer, desc,
     cover(표지 사진), spreads[펼침면 사진], full(전체 공개 여부), works[이 작가 작품 번호(0부터)],
     exhibition(전시 id), toc[목차], links[{name,url}]}
   표지 사진이 없으면 글자로 만든 표지를 보여줘요 (다른 곳의 이미지를 가져오지 않아요). */
const BOOK_KINDS=["전시 도록","화집","작가 저서"];
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
/* 검색에 알릴 주소와 내용 요약. 관리자에서 저장한 뒤 바뀐 주소만 골라 네이버에 바로 알려요. */
function seoPages(){const m={"/":"home"};
  ARTISTS.filter(artistIndexable).forEach(a=>{
    m[artistPath(a.id)]=JSON.stringify([a.name,a.en,a.born,a.tier,a.genre,a.more,a.tags,a.line,a.quote,a.bio,a.cv,a.history,a.collections,a.books,a.works.length]);
    /* 작품 페이지는 사진이 있을 때만 노출해요 (글만 있는 얇은 페이지는 빼요) */
    if(a.photos)a.works.forEach((w,i)=>m[workPath(a.id,i)]=JSON.stringify([a.name,w,a.photos[i%a.photos.length]]))});
  EXHIBITIONS.filter(exIndexable).forEach(e=>m[exPath(e)]=JSON.stringify([e.title,e.kind,e.start,e.end,e.g,e.artists,e.desc]));
  BOOKS.filter(bookIndexable).forEach(b=>m[bookPath(b)]=JSON.stringify(b));
  GALLERIES.filter(galIndexable).forEach(g=>m[galPath(g.id)]=JSON.stringify([g,EXHIBITIONS.filter(e=>e.g===g.id&&exIndexable(e)).map(e=>e.id)]));
  return m}
const exOfGal=gid=>EXHIBITIONS.filter(e=>e.g===gid).map(e=>({...e,st:status(e)}));
const sameDay=(a,b)=>a.getTime()===b.getTime();
const runningOn=d=>EXHIBITIONS.filter(e=>parse(e.start)<=d&&d<=parse(e.end));
function weekStart(d){const k=(d.getDay()+6)%7;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-k)}
const NOTICES=[
  {date:"2026.10.06",tag:"공지",title:"세 작가의 공간으로 새로 시작해요",body:"작품 이미지 사용을 허락받은 기산 정명희, 이민구, 이홍원 작가의 공간을 먼저 열었어요. 시안에 넣었던 예시 작가와 예시 전시는 모두 지웠어요. 작가 소개는 공개된 기사와 자료를 바탕으로 arttan이 정리했고, 출처를 작가 공간에 함께 적어 두었어요."},
  {date:"2026.09.29",tag:"안내",title:"작가 등록 신청은 이렇게 해요",body:"위쪽의 '작가 등록' 버튼으로 신청하면 운영팀이 확인한 뒤 승인해요. 작가 공간 개설과 작품 아카이브는 모두 무료예요."},
  {date:"2026.09.28",tag:"안내",title:"arttan 주소는 www.arttan.co.kr 이에요",body:"art(미술)와 灘(여울 탄)을 합친 이름이에요."}];


/* ---------- 관리자 저장소 (사이트·관리자 공용) ---------- */
const AD_KEY="arttan.admin.v1";
const AD_DEF=()=>({artists:[],exhibitions:[],edits:{},hidden:{},done:{},apps:[],books:[],bookEdits:{},bookDel:{}});
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
  /* 관리자에서 추가·수정·삭제한 책 (Supabase 없이 이 브라우저에만 저장할 때) */
  (AD.books||[]).forEach(b=>{if(!BOOKS.some(x=>x.id===b.id)&&byId[b.artist])BOOKS.push({...b,added:true})});
  Object.entries(AD.bookEdits||{}).forEach(([id,e])=>{const b=BOOKS.find(x=>x.id===id);if(b)Object.assign(b,e)});
  for(let i=BOOKS.length-1;i>=0;i--)if((AD.bookDel||{})[BOOKS[i].id])BOOKS.splice(i,1);
  AD.exhibitions.forEach(e=>{if(!EXHIBITIONS.some(x=>x.id===e.id)&&galById[e.g]&&e.artists.every(id=>byId[id]))EXHIBITIONS.push({...e,venue:galById[e.g].name,region:galById[e.g].area,added:true})});
}
const noticeList=()=>AD.notices||NOTICES;
