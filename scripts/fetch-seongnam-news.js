const fs = require('fs');
const path = require('path');
const { quoteFrontmatterColons } = require('./yaml-safe');

// XML <item> 블록에서 특정 태그 값 추출 (CDATA 포함)
function parseTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

// RSS URL에서 뉴스 목록 수집 → 48시간 필터 → 최신순 상위 N개 반환
async function fetchNewsItems(rssUrl, limit = 5) {
  let rssText = '';
  try {
    const rssRes = await fetch(rssUrl);
    if (!rssRes.ok) throw new Error(`RSS fetch failed with status ${rssRes.status}`);
    rssText = await rssRes.text();
  } catch (err) {
    console.log('RSS 수집 실패:', err.message);
    return [];
  }

  const itemBlocks = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(rssText)) !== null) {
    itemBlocks.push(itemMatch[1]);
  }

  const now = Date.now();
  const fortyEightHours = 48 * 60 * 60 * 1000;
  const newsItems = [];

  for (const block of itemBlocks) {
    const rawTitle = parseTag(block, 'title');
    const link = parseTag(block, 'link') || block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || '';
    const pubDateStr = parseTag(block, 'pubDate');

    if (!rawTitle || !pubDateStr) continue;

    const pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) continue;
    if (now - pubDate.getTime() > fortyEightHours) continue;

    // 제목 끝의 " - 언론사명" 분리
    const publisherMatch = rawTitle.match(/^([\s\S]+?)\s+-\s+([^-]+)$/);
    const title = publisherMatch ? publisherMatch[1].trim() : rawTitle.trim();
    const publisher = publisherMatch ? publisherMatch[2].trim() : '언론사 미상';

    newsItems.push({ title, publisher, link, pubDate });
  }

  newsItems.sort((a, b) => b.pubDate - a.pubDate);
  return newsItems.slice(0, limit);
}

// Pexels 사진을 frontmatter 바로 아래에 삽입
async function insertPexelsPhoto(content, pexelsApiKey, searchQuery) {
  if (!pexelsApiKey) {
    console.log('PEXELS_API_KEY 없음, 사진 없이 저장합니다.');
    return content;
  }
  try {
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
    const pexelsRes = await fetch(pexelsUrl, { headers: { Authorization: pexelsApiKey } });
    if (!pexelsRes.ok) {
      console.log('Pexels API 응답 오류, 사진 없이 저장합니다.');
      return content;
    }
    const pexelsData = await pexelsRes.json();
    if (!pexelsData.photos || pexelsData.photos.length === 0) {
      console.log('Pexels: 검색 결과 없음, 사진 없이 저장합니다.');
      return content;
    }
    const photo = pexelsData.photos[0];
    const photoMarkdown = `![${photo.alt || searchQuery}](${photo.src.large})\n*사진: [${photo.photographer}](${photo.photographer_url}), Pexels 제공*`;
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd !== -1) {
      const afterFrontmatter = content.slice(frontmatterEnd + 3).trimStart();
      content = content.slice(0, frontmatterEnd + 3) + '\n\n' + photoMarkdown + '\n\n' + afterFrontmatter;
      console.log(`Pexels 사진 삽입 완료: ${photo.src.large}`);
    }
  } catch (err) {
    console.log('Pexels API 호출 실패, 사진 없이 저장합니다:', err.message);
  }
  return content;
}

// Gemini에 브리핑 글 작성 요청
async function generateBriefing(geminiApiKey, promptText) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
  });
  if (!geminiRes.ok) throw new Error(`Gemini API returned status ${geminiRes.status}`);
  const geminiData = await geminiRes.json();
  let text = geminiData.candidates[0].content.parts[0].text.trim();
  // 코드블록 래핑 제거
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
  }
  return text;
}

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  if (!geminiApiKey) {
    console.log('GEMINI_API_KEY가 없습니다. 종료합니다.');
    return;
  }

  const dateForTitle = new Date(todayStr + 'T00:00:00+09:00');
  const monthDay = `${dateForTitle.getMonth() + 1}월 ${dateForTitle.getDate()}일`;

  // ─────────────────────────────────────────────
  // 브리핑 1: 성남시 일반 뉴스
  // ─────────────────────────────────────────────
  console.log('\n[브리핑 1] 성남시 뉴스 수집 중...');
  const briefing1Filename = `${todayStr}-seongnam-news-briefing.md`;
  const briefing1Path = path.join(postsDir, briefing1Filename);

  if (fs.existsSync(briefing1Path)) {
    console.log('이미 작성된 글입니다 (성남시 브리핑)');
  } else {
    const news1 = await fetchNewsItems(
      'https://news.google.com/rss/search?q=%EC%84%B1%EB%82%A8%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko'
    );

    if (news1.length === 0) {
      console.log('48시간 이내 성남시 뉴스가 없습니다. 브리핑 1을 건너뜁니다.');
    } else {
      console.log(`수집된 뉴스 ${news1.length}건:`);
      news1.forEach((n, i) => console.log(`  ${i + 1}. [${n.publisher}] ${n.title}`));

      const newsListText1 = news1
        .map((n, i) => `${i + 1}. 제목: ${n.title} | 언론사: ${n.publisher} | 링크: ${n.link}`)
        .join('\n');

      const prompt1 = `너는 성남시에 15년째 살고 있는 생활정보 블로거야. 이웃에게 알려주듯 담백하고 신뢰감 있게 글을 써.

오늘(${todayStr}) 성남 관련 뉴스 ${news1.length}건의 제목과 언론사를 바탕으로 뉴스 브리핑 글을 작성해줘.

[오늘의 뉴스 목록]
${newsListText1}

[글쓰기 규칙 - 반드시 지켜]
1. 문체: 차분한 존댓말. 느낌표는 글 전체에서 최대 1번만.
2. 광고 문구와 이모지 전부 금지.
3. 중요: 기사 내용을 지어내지 마. 제목에서 알 수 있는 사실만 언급하고, 자세한 내용은 링크로 안내해.
4. 각 뉴스마다: 소제목(뉴스 제목 그대로)으로 시작하고, 이 소식이 성남 시민에게 어떤 의미인지 2~3문장 코멘트.
5. 각 뉴스 코멘트 끝에 반드시 "출처: [언론사명](뉴스링크)" 형식으로 출처 표기.
6. 글 도입부: "안녕하세요"로 시작하지 마. 날짜와 오늘 성남 소식을 자연스럽게 소개하는 한두 문장으로 시작해.
7. 오늘 날짜는 ${todayStr}이다. 계절이나 시기를 언급할 때는 반드시 이 날짜에 맞게 써.

## 아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:

---
title: "${monthDay} 성남 소식 브리핑"
date: ${todayStr}
summary: (오늘 뉴스를 한 줄로 요약)
category: 뉴스
tags: [성남시, 뉴스브리핑, 지역소식]
---

(본문: 위의 글쓰기 규칙 준수, 뉴스 ${news1.length}건 모두 포함)`;

      try {
        console.log('Gemini에 성남시 브리핑 글 작성 요청 중...');
        let content1 = await generateBriefing(geminiApiKey, prompt1);
        content1 = await insertPexelsPhoto(content1, pexelsApiKey, 'korea city');
        fs.writeFileSync(briefing1Path, quoteFrontmatterColons(content1), 'utf8');
        console.log(`성남시 뉴스 브리핑 저장 완료: ${briefing1Filename}`);
      } catch (err) {
        console.log('성남시 브리핑 생성 실패:', err.message);
      }
    }
  }

  // ─────────────────────────────────────────────
  // 브리핑 2: 분당 재건축 / 성남 재개발 뉴스
  // ─────────────────────────────────────────────
  console.log('\n[브리핑 2] 분당 재건축·성남 재개발 뉴스 수집 중...');
  const briefing2Filename = `${todayStr}-bundang-redevelopment-news.md`;
  const briefing2Path = path.join(postsDir, briefing2Filename);

  if (fs.existsSync(briefing2Path)) {
    console.log('이미 작성된 글입니다 (재개발 브리핑)');
  } else {
    const news2 = await fetchNewsItems(
      'https://news.google.com/rss/search?q=%22%EB%B6%84%EB%8B%B9%20%EC%9E%AC%EA%B1%B4%EC%B6%95%22%20OR%20%22%EC%84%B1%EB%82%A8%20%EC%9E%AC%EA%B0%9C%EB%B0%9C%22&hl=ko&gl=KR&ceid=KR:ko'
    );

    if (news2.length === 0) {
      console.log('48시간 이내 재개발 뉴스가 없습니다. 브리핑 2를 건너뜁니다.');
    } else {
      console.log(`수집된 재개발 뉴스 ${news2.length}건:`);
      news2.forEach((n, i) => console.log(`  ${i + 1}. [${n.publisher}] ${n.title}`));

      const newsListText2 = news2
        .map((n, i) => `${i + 1}. 제목: ${n.title} | 언론사: ${n.publisher} | 링크: ${n.link}`)
        .join('\n');

      const prompt2 = `너는 성남시에 15년째 살고 있는 생활정보 블로거야. 이웃에게 알려주듯 담백하고 신뢰감 있게 글을 써.

오늘(${todayStr}) 분당 재건축·성남 재개발 관련 뉴스 ${news2.length}건의 제목과 언론사를 바탕으로 뉴스 브리핑 글을 작성해줘.

[오늘의 뉴스 목록]
${newsListText2}

[글쓰기 규칙 - 반드시 지켜]
1. 문체: 차분한 존댓말. 느낌표는 글 전체에서 최대 1번만.
2. 광고 문구와 이모지 전부 금지.
3. 중요: 기사 내용을 지어내지 마. 제목에서 알 수 있는 사실만 언급하고, 자세한 내용은 링크로 안내해.
4. 부동산 투자 조언이나 가격 전망은 절대 쓰지 마. 제목에서 확인되는 사실과 시민에게 미치는 영향만 담백하게 코멘트해.
5. 각 뉴스마다: 소제목(뉴스 제목 그대로)으로 시작하고, 이 소식이 해당 지역 주민에게 어떤 의미인지 2~3문장 코멘트.
6. 각 뉴스 코멘트 끝에 반드시 "출처: [언론사명](뉴스링크)" 형식으로 출처 표기.
7. 글 도입부: "안녕하세요"로 시작하지 마. 날짜와 오늘 소식을 자연스럽게 소개하는 한두 문장으로 시작해.
8. 오늘 날짜는 ${todayStr}이다. 계절이나 시기를 언급할 때는 반드시 이 날짜에 맞게 써.
9. 글 마지막에 반드시 다음 문구를 추가해: "본 글은 뉴스 제목 기반 요약으로, 자세한 내용은 각 기사 원문을 확인해 주세요."

## 아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:

---
title: "${monthDay} 분당·성남 재개발 소식"
date: ${todayStr}
summary: (오늘 재개발 뉴스를 한 줄로 요약)
category: 재개발
tags: [성남시, 분당재건축, 재개발, 부동산]
---

(본문: 위의 글쓰기 규칙 준수, 뉴스 ${news2.length}건 모두 포함)`;

      try {
        console.log('Gemini에 재개발 브리핑 글 작성 요청 중...');
        let content2 = await generateBriefing(geminiApiKey, prompt2);
        content2 = await insertPexelsPhoto(content2, pexelsApiKey, 'korea city');
        fs.writeFileSync(briefing2Path, quoteFrontmatterColons(content2), 'utf8');
        console.log(`재개발 뉴스 브리핑 저장 완료: ${briefing2Filename}`);
      } catch (err) {
        console.log('재개발 브리핑 생성 실패:', err.message);
      }
    }
  }
}

main().catch(err => {
  console.log('예상치 못한 오류 발생:', err.message);
});
