# artists/ — 작가별 아카이브 데이터

작가 한 명당 폴더 하나예요. 다른 작가의 자료를 섞지 않아요.

```
artists/
  jmh/
    artist.js     ← 정명희: 정보 · 작품 목록 · 인터뷰 · 영상 · 도록
    works/        ← 정명희 작품 이미지만
  hsy/
    artist.js
  ...
```

## artist.js 안에 들어가는 것
- `id` 작가 고유 아이디 (폴더 이름과 같아야 해요)
- `name`, `en`, `tier`(원로/중견/청년작가), `genre`, `more`(부가 장르), `tags`, `born`, `city` …
- `bio`, `cv`(이력), `history`(지난 개인전), `collections`(소장처), `pubs`(저서)
- `works` 작품 목록 `[제목, 연도, 재료, 크기, 간단한 설명(선택)]` — 설명은 비워도 돼요
- `photos` 작품 이미지 경로 (반드시 `artists/<id>/works/` 안)
- `interviews` 이 작가 인터뷰만, `video` 인터뷰 영상, `books` 이 작가 도록만

## 새 작가 추가
1. `artists/<새id>/artist.js` 를 만들고 `registerArtist({ id:"<새id>", ... })` 로 작성
2. 이미지는 `artists/<새id>/works/` 에 넣기
3. `app.html`, `admin.html` 의 작가 목록 `<script src="artists/<새id>/artist.js">` 한 줄 추가

전시(여러 작가가 함께하는 전시 포함)와 갤러리는 작가 폴더가 아니라 `core.js` 에서 작가 id로 연결해요.

현재 작가: jmh, ysg, sjw, cjs, mjh, oeb, pjo, jmr, hsy, ldh, knr, rhj

## 도록 · 화집 · 저서 넣기

`artist.js` 의 `books:[ … ]` 에 한 권씩 넣어요. 주소는 `/book/<id>` 가 돼요.

```js
{id:"lhw-2025", kind:"전시 도록",          // 전시 도록 · 화집 · 작가 저서
 title:"…", year:2025, pages:96, size:"230×300mm", publisher:"…", isbn:"…", writer:"글쓴이",
 desc:"소개 글 (40자 이상이면 검색에 노출)",
 cover:"artists/lhw/books/2025-cover.jpg",   // 표지 사진 (작가 제공). 없으면 글자 표지
 spreads:["artists/lhw/books/2025-01.jpg"],  // 펼침면 사진 (작가가 허락한 것만)
 full:false,                                 // true = 전체 공개(e북), false = 미리보기
 works:[27,28],                              // 이 책에 실린 작품 (works 목록 순서, 0부터)
 exhibition:"ex01",                          // 연결된 전시 id
 toc:["인사말","작품","약력"], links:[{name:"구매처",url:"https://…"}]}
```

- 표지·펼침면은 **작가나 출판사가 허락한 사진만** 올려요. 다른 사이트의 표지 이미지를 가져오지 않아요.
- 도서관 찾기 링크(국립중앙도서관 검색)는 자동으로 붙어요.
