const fs = require('fs');
const path = require('path');
const { quoteFrontmatterColons } = require('./yaml-safe');

// 네이버 키워드 도구로 추출한 분당/성남 부동산 및 재건축 관련 키워드들
const KEYWORDS = [
  '백현마을2단지', '판교TH', '판교어울림', '판교아파트시세', '판교시세',
  '동판교부동산', '구미동원룸', '분당투룸', '미금역투룸', '선릉역상가임대',
  '판교아파트매매', '성남아파트', '야탑빌라전세', '청솔주공9단지', '구미동월드메르디앙',
  '봇들마을4단지', '수지테라스하우스', '낙생지구', '서현동상가', '서현역상가임대',
  '서현동사무실', '만안부동산', '수지타운하우스', '서판교타운하우스', '용인플랫폼시티',
  '아페르한강', '삼평동부동산', '한남더힐', '판교테크노밸리중흥S클래스', '판교청약',
  '뉴홈', '판교월세', '알파리움2단지', '서현역상가', '대장동금강펜테리움',
  '백현MICE', '판교중흥S클래스', '분당아파트전세', '판교부동산', '성남청약',
  '판교집값', '판교아파트', '성남부동산', '판교212', '대장동테라스하우스',
  'THE212', 'TH212분양가', '판교분양', '대장동TH212', '판교TH212모델하우스',
  '판교타운하우스', '판교푸르지오그랑블', '판교TH212분양가', '미금역', '봇들마을9단지',
  '서현역부동산', '서현동아파트', '대장동타운하우스', '구미동부동산', '라포르테블랑서현',
  '봇들마을1단지', '야탑원룸', '분당재건축', '판교TH212', 'TH212',
  '서현동부동산', '분당아파트매매', '분당선도지구', '분당아파트', '미금역부동산',
  '판교테라스하우스', '알파리움'
];

// 배열에서 랜덤하게 N개 추출
function getRandomKeywords(count = 3) {
  const shuffled = [...KEYWORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 네이버 블로그 검색 API 호출
async function fetchNaverBlogSearch(query, clientId, clientSecret, display = 5) {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${display}&sort=sim`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret
      }
    });
    if (!res.ok) throw new Error(`Naver API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error(`네이버 블로그 검색 실패 (${query}):`, err.message);
    return [];
  }
}

// Pexels 사진 삽입 (기존과 동일)
async function insertPexelsPhoto(content, pexelsApiKey, searchQuery) {
  if (!pexelsApiKey) return content;
  try {
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
    const pexelsRes = await fetch(pexelsUrl, { headers: { Authorization: pexelsApiKey } });
    if (!pexelsRes.ok) return content;
    const pexelsData = await pexelsRes.json();
    if (!pexelsData.photos || pexelsData.photos.length === 0) return content;
    const photo = pexelsData.photos[0];
    const photoMarkdown = `![${photo.alt || searchQuery}](${photo.src.large})\n*사진: [${photo.photographer}](${photo.photographer_url}), Pexels 제공*`;
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd !== -1) {
      const afterFrontmatter = content.slice(frontmatterEnd + 3).trimStart();
      content = content.slice(0, frontmatterEnd + 3) + '\n\n' + photoMarkdown + '\n\n' + afterFrontmatter;
    }
  } catch (err) {
    console.log('Pexels API 호출 실패:', err.message);
  }
  return content;
}

// Gemini로 포스트 작성
async function generatePostWithGemini(geminiApiKey, promptText) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
  });
  if (!geminiRes.ok) throw new Error(`Gemini API error: ${geminiRes.status}`);
  const geminiData = await geminiRes.json();
  let text = geminiData.candidates[0].content.parts[0].text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
  }
  return text;
}

// 태그 제거용 헬퍼 함수
function stripHtml(html) {
  return html.replace(/<[^>]*>?/gm, '');
}

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!geminiApiKey || !naverClientId || !naverClientSecret) {
    console.error('필요한 API 키가 누락되었습니다. (.env.local 확인: GEMINI_API_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)');
    return;
  }

  // 나중에_입력인 경우 방어 로직
  if (naverClientId === '나중에_입력' || naverClientSecret === '나중에_입력') {
    console.error('네이버 API 키를 먼저 발급받아 .env.local에 입력해주세요!');
    return;
  }

  const postsDir = path.join(process.cwd(), 'src/content/posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const dateForTitle = new Date(todayStr + 'T00:00:00+09:00');
  const monthDay = `${dateForTitle.getMonth() + 1}월 ${dateForTitle.getDate()}일`;

  // 이번 턴에 다룰 메인 키워드 3개 랜덤 추출
  const selectedKeywords = getRandomKeywords(3);
  console.log(`선택된 메인 키워드: ${selectedKeywords.join(', ')}`);

  // 네이버 블로그 검색 데이터 통합
  let combinedBlogItems = [];
  for (const keyword of selectedKeywords) {
    const items = await fetchNaverBlogSearch(keyword, naverClientId, naverClientSecret, 3);
    combinedBlogItems.push({ keyword, items });
  }

  // 검색 결과가 없는 경우 방어
  if (combinedBlogItems.every(group => group.items.length === 0)) {
    console.log('검색된 블로그 글이 없습니다.');
    return;
  }

  // 프롬프트에 넣을 컨텍스트 텍스트 구성
  let searchContext = '';
  combinedBlogItems.forEach(group => {
    searchContext += `\n### 키워드: ${group.keyword}\n`;
    group.items.forEach((item, index) => {
      searchContext += `${index + 1}. 제목: ${stripHtml(item.title)}\n`;
      searchContext += `   요약: ${stripHtml(item.description)}\n`;
      searchContext += `   링크: ${item.link}\n`;
    });
  });

  const prompt = `너는 분당/판교/성남 부동산 정보와 지역 소식을 전하는 인기 블로거야.
사람들의 관심을 끌고 검색 유입(SEO)을 극대화할 수 있도록, 오늘 수집된 네이버 블로그 포스팅들을 분석해서 하나의 새롭고 흥미로운 종합 요약 포스트를 작성해줘.

[오늘의 키워드]
${selectedKeywords.join(', ')}

[네이버 블로그 검색 결과 (참고용)]
${searchContext}

[글쓰기 규칙 - 매우 중요]
1. 타겟 독자: 분당 재건축, 판교 아파트, 부동산 시세에 관심 있는 사람들.
2. 문체: 읽기 쉽고 흥미를 유발하는 블로그 스타일 (기존의 딱딱한 뉴스 브리핑보다 조금 더 생동감 있고 부드러운 존댓말 사용).
3. 구성:
   - 도입부: 현재 사람들의 관심(키워드)을 바탕으로 화두를 던짐. (예: "요즘 분당과 판교 지역 부동산 시장, 정말 뜨겁죠?")
   - 본론: 위의 검색 결과 요약본을 종합해서, 현재 이 키워드들과 관련된 트렌드나 반응이 어떤지 2~3개의 소주제로 나누어 정리. (절대로 기사를 허구로 지어내지 말고, 검색 결과 내용 안에서만 유추해.)
   - 결론: 마무리 인사이트 및 "자세한 현장 소식이나 원문 블로그 글들을 찾아보시면 더 좋은 정보를 얻으실 수 있습니다" 식의 행동 유도.
4. 광고나 이모지 사용은 자제하고, 신뢰감 있게 작성.
5. 출처 표기: 각 소주제나 구체적 언급 후에는 "관련 검색된 블로그 글 참고" 정도로 자연스럽게 안내하되, 주요 정보 링크 1~2개는 텍스트 내에 자연스럽게 삽입해줘.
6. 글 도입부에 "안녕하세요"로 시작하지 말고 바로 본론의 흥미로운 화두로 시작해.

## 아래 형식으로 출력해줘 (Markdown Frontmatter 포함, 다른 텍스트 없이):

---
title: "${monthDay} 분당·판교 부동산 트렌드: ${selectedKeywords[0]}, ${selectedKeywords[1]} 최신 동향"
date: ${todayStr}
summary: "${selectedKeywords.join(', ')} 등 최근 주목받는 성남/분당 지역 부동산 키워드 최신 반응 요약"
category: 부동산
tags: [성남부동산, 분당재건축, 판교부동산, ${selectedKeywords[0]}, ${selectedKeywords[1]}]
---

(본문 내용 시작 - Markdown 포맷으로 작성, 가독성 높은 소제목 활용)`;

  const filename = `${todayStr}-real-estate-trends-${Date.now()}.md`;
  const filePath = path.join(postsDir, filename);

  try {
    console.log('Gemini에 실시간 트렌드 글 작성 요청 중...');
    let content = await generatePostWithGemini(geminiApiKey, prompt);
    
    // 대표 이미지 삽입 (건물, 부동산 느낌)
    content = await insertPexelsPhoto(content, pexelsApiKey, 'modern city apartment');
    
    fs.writeFileSync(filePath, quoteFrontmatterColons(content), 'utf8');
    console.log(`트렌드 포스트 저장 완료: ${filename}`);
  } catch (err) {
    console.log('포스트 생성 실패:', err.message);
  }
}

main().catch(err => {
  console.log('예상치 못한 오류 발생:', err.message);
});
