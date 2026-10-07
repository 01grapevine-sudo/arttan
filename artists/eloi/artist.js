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
   /* 작가 인터뷰: 영상·사진·글(소개·본문·문답)을 모두 넣을 수 있고, 넣은 것만 보여요 (테스트용 샘플) */
   interviews:[
     {id:"eloi-studio", title:"오후의 빛을 붙잡는 법 — 엘로이 작업실에서", date:"2025.05.12", exhibition:"eloi-2025",
      lead:"[테스트용 샘플 인터뷰] 첫 개인전 「정원의 오후」를 마친 엘로이의 작업실을 찾아가 작업 이야기를 들었어요.",
      video:{src:"artists/eloi/interviews/studio.mp4", poster:"artists/eloi/interviews/studio-poster.jpg", title:"엘로이의 작업실에서 (테스트 영상, 14초)"},
      photos:[
        {src:"artists/eloi/interviews/studio-01.jpg", caption:"이젤 앞에서 「보랏빛 숨」을 그리는 작가"},
        {src:"artists/eloi/interviews/studio-02.jpg", caption:"벽에 기대어 둔 작업들"},
        {src:"artists/eloi/interviews/studio-03.jpg", caption:"작업실 팔레트"}],
      body:"작업실은 서울의 한 오래된 건물 3층에 있어요. 남쪽으로 난 큰 창 덕분에 오후가 되면 방 전체가 따뜻한 색으로 물들어요. 엘로이는 이 시간을 '그림이 가장 잘 보이는 때'라고 불러요.\n\n이젤 옆에는 색을 시험한 종이가 수십 장 쌓여 있었어요. 원 하나를 그리기 전에 그 원이 놓일 자리의 색을 여러 번 바꿔 본다고 해요.",
      qa:[["왜 '오후의 정원'이었나요?","하루 중 빛이 가장 오래 머무는 시간이 오후라고 생각했어요. 같은 정원도 오후에는 색이 겹쳐 보여서, 그 겹침을 원과 색면으로 옮겨 보고 싶었어요."],
          ["화면에 원이 많이 등장해요.","원은 해이기도 하고 나무의 그늘이기도 해요. 정확한 모양을 그리기보다 빛이 머문 자리를 표시하는 방식이에요."],
          ["다음 작업은요?","올해 11월 「빛이 머무는 자리」에서 신작 여덟 점을 보여드려요. 이번엔 정원 대신 방 안으로 들어온 빛을 그렸어요."]]}],
   video:null,
   books:[
     {id:"eloi-light", kind:"전시 도록", title:"빛이 머무는 자리", year:2026, pages:48, size:"210×280mm", publisher:"arttan (샘플)", writer:"arttan 편집부",
      desc:"[테스트용 샘플 도록] 엘로이 개인전 「빛이 머무는 자리」에 맞춰 만든 가상의 전시 도록이에요. 도록 페이지의 표지, 미리보기, 실린 작품, 목차, 연결 전시 기능을 시험해요.",
      cover:"artists/eloi/books/light-cover.jpg",
      spreads:["artists/eloi/books/light-01.jpg","artists/eloi/books/light-02.jpg","artists/eloi/books/light-03.jpg","artists/eloi/books/light-04.jpg"],
      full:false, works:[0,2,5,6,7], exhibition:"eloi-2026",
      toc:["인사말","빛이 머무는 자리 — 작품 8점","작가 노트","약력"]}]
});
