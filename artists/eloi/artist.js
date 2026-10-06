/* arttan 작가 아카이브 — 엘로이 (eloi) · ★ 테스트용 가상 작가 ★
   실제 인물이 아니에요. 작품·포스터·도록 기능을 시험하려고 만든 샘플이고, 이미지는 scripts/make-sample-eloi.mjs 로 직접 그렸어요.
   real:false 라서 검색에 노출되지 않아요(noindex, 사이트맵 제외). 실제 오픈 전에 이 파일과 script 태그를 지우세요. */
registerArtist({
   id:"eloi", real:false, test:true, tier:"청년작가", name:"엘로이", en:"Eloi · 테스트용 가상 작가", genre:"서양화", more:["드로잉·일러스트"], tags:["테스트용 샘플","색면","빛"], born:1992, city:"서울", style:"bands", pal:["#F3EEE4","#2E2A5A","#7C3AED","#E8B4A0","#14112B"],
   photos:["01","02","03","04","05","06","07","08"].map(n=>`artists/eloi/works/${n}.jpg`),
   line:"[테스트용 가상 작가] 빛과 색이 머무는 자리를 그려요",
   quote:"",
   bio:"엘로이는 arttan의 작품·전시·도록 기능을 시험하려고 만든 가상의 작가예요. 실제 인물이 아니며, 작품 이미지와 포스터, 도록 표지와 펼침면은 모두 arttan이 코드로 직접 그린 샘플이에요. 겹쳐진 원과 색면, 부드러운 곡선으로 빛이 머무는 순간을 표현한다는 설정이에요.",
   cv:[["2026","개인전 「빛이 머무는 자리」 (샘플)"],["2025","첫 개인전 「정원의 오후」 (샘플)"]],
   collections:"",
   /* [제목, 연도, 재료, 크기, 설명] */
   works:[
     ["빛이 머무는 자리",2026,"캔버스에 아크릴","130×97cm","전시 「빛이 머무는 자리」 대표작 (샘플)"],
     ["정원의 오후",2025,"캔버스에 아크릴","91×117cm","첫 개인전 대표작 (샘플)"],
     ["물결 위의 원",2025,"캔버스에 아크릴","116×91cm",""],
     ["새벽의 방",2025,"캔버스에 유채","72×60cm",""],
     ["느린 바람",2026,"캔버스에 아크릴","60×80cm",""],
     ["겹쳐진 시간",2026,"캔버스에 유채","100×80cm",""],
     ["보랏빛 숨",2026,"캔버스에 아크릴","73×91cm","도록 표지에 실린 작품 (샘플)"],
     ["작은 우주",2026,"종이에 과슈","56×76cm",""]],
   interviews:[],
   video:null,
   books:[
     {id:"eloi-light", kind:"전시 도록", title:"빛이 머무는 자리", year:2026, pages:48, size:"210×280mm", publisher:"arttan (샘플)", writer:"arttan 편집부",
      desc:"[테스트용 샘플 도록] 엘로이 개인전 「빛이 머무는 자리」에 맞춰 만든 가상의 전시 도록이에요. 도록 페이지의 표지, 미리보기, 실린 작품, 목차, 연결 전시 기능을 시험해요.",
      cover:"artists/eloi/books/light-cover.jpg",
      spreads:["artists/eloi/books/light-01.jpg","artists/eloi/books/light-02.jpg","artists/eloi/books/light-03.jpg","artists/eloi/books/light-04.jpg"],
      full:false, works:[0,2,5,6,7], exhibition:"eloi-2026",
      toc:["인사말","빛이 머무는 자리 — 작품 8점","작가 노트","약력"]}]
});
