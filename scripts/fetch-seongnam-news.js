const fs = require('fs');
const path = require('path');

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Ensure posts directory exists
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 3. 오늘 날짜 브리핑 파일이 이미 있으면 종료
  const briefingFilename = `${todayStr}-seongnam-news-briefing.md`;
  const briefingPath = path.join(postsDir, briefingFilename);
  if (fs.existsSync(briefingPath)) {
    console.log('이미 작성된 글입니다');
    return;
  }

  // 1. Google News RSS 가져오기
  console.log('Google News RSS 수집 중...');
  let rssText = '';
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=%EC%84%B1%EB%82%A8%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko';
    const rssRes = await fetch(rssUrl);
    if (!rssRes.ok) {
      throw new Error(`RSS fetch failed with status ${rssRes.status}`);
    }
    rssText = await rssRes.text();
  } catch (err) {
    console.log('RSS 수집 실패, 종료합니다:', err.message);
    return;
  }

  // XML에서 <item> 블록 추출 (정규식)
  const itemBlocks = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(rssText)) !== null) {
    itemBlocks.push(itemMatch[1]);
  }

  if (itemBlocks.length === 0) {
    console.log('RSS에서 뉴스 항목을 찾지 못했습니다. 종료합니다.');
    return;
  }

  // 각 item에서 title, link, pubDate 추출
  const parseTag = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, 'i'));
    return m ? m[1].trim() : '';
  };

  const now = Date.now();
  const fortyEightHours = 48 * 60 * 60 * 1000;

  const newsItems = [];
  for (const block of itemBlocks) {
    const rawTitle = parseTag(block, 'title');
    const link = parseTag(block, 'link') || block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || '';
    const pubDateStr = parseTag(block, 'pubDate');

    if (!rawTitle || !pubDateStr) continue;

    // pubDate 파싱 및 48시간 필터
    const pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) continue;
    if (now - pubDate.getTime() > fortyEightHours) continue;

    // 언론사 분리: 제목 끝의 " - 언론사명" 패턴
    const publisherMatch = rawTitle.match(/^([\s\S]+?)\s+-\s+([^-]+)$/);
    const title = publisherMatch ? publisherMatch[1].trim() : rawTitle.trim();
    const publisher = publisherMatch ? publisherMatch[2].trim() : '언론사 미상';

    newsItems.push({ title, publisher, link, pubDate });
  }

  if (newsItems.length === 0) {
    console.log('48시간 이내 뉴스가 없습니다. 종료합니다.');
    return;
  }

  // 2. 최신순 정렬 후 상위 5개
  newsItems.sort((a, b) => b.pubDate - a.pubDate);
  const top5 = newsItems.slice(0, 5);

  console.log(`수집된 뉴스 ${top5.length}건:`);
  top5.forEach((n, i) => console.log(`  ${i + 1}. [${n.publisher}] ${n.title}`));

  // Gemini API 키 확인
  if (!geminiApiKey) {
    console.log('GEMINI_API_KEY가 없습니다. 종료합니다.');
    return;
  }

  // 날짜 표시용 (예: 7월 17일)
  const dateForTitle = new Date(todayStr + 'T00:00:00+09:00');
  const monthDay = `${dateForTitle.getMonth() + 1}월 ${dateForTitle.getDate()}일`;

  // 뉴스 목록을 텍스트로 정리
  const newsListText = top5
    .map((n, i) => `${i + 1}. 제목: ${n.title} | 언론사: ${n.publisher} | 링크: ${n.link}`)
    .join('\n');

  // 4. Gemini에 브리핑 글 작성 요청
  const prompt = `너는 성남시에 15년째 살고 있는 생활정보 블로거야. 이웃에게 알려주듯 담백하고 신뢰감 있게 글을 써.

오늘(${todayStr}) 성남 관련 뉴스 5건의 제목과 언론사를 바탕으로 뉴스 브리핑 글을 작성해줘.

[오늘의 뉴스 목록]
${newsListText}

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

(본문: 위의 글쓰기 규칙 준수, 뉴스 5건 모두 포함)`;

  console.log('Gemini에 브리핑 글 작성 요청 중...');
  let generatedText = '';
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!geminiRes.ok) {
      throw new Error(`Gemini API returned status ${geminiRes.status}`);
    }
    const geminiData = await geminiRes.json();
    generatedText = geminiData.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.log('Gemini API 호출 실패, 종료합니다:', err.message);
    return;
  }

  // 코드블록 래핑 제거
  let content = generatedText;
  if (content.startsWith('```')) {
    content = content.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
  }

  // 5. Pexels 사진 삽입 ("korea city" 고정 검색어)
  if (pexelsApiKey) {
    try {
      const pexelsUrl = 'https://api.pexels.com/v1/search?query=korea%20city&per_page=1&orientation=landscape';
      const pexelsRes = await fetch(pexelsUrl, {
        headers: { Authorization: pexelsApiKey }
      });
      if (pexelsRes.ok) {
        const pexelsData = await pexelsRes.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          const photo = pexelsData.photos[0];
          const photoMarkdown = `![${photo.alt || 'korea city'}](${photo.src.large})\n*사진: [${photo.photographer}](${photo.photographer_url}), Pexels 제공*`;
          // frontmatter 닫는 --- 뒤에 삽입
          const frontmatterEnd = content.indexOf('---', 3);
          if (frontmatterEnd !== -1) {
            const afterFrontmatter = content.slice(frontmatterEnd + 3).trimStart();
            content = content.slice(0, frontmatterEnd + 3) + '\n\n' + photoMarkdown + '\n\n' + afterFrontmatter;
            console.log(`Pexels 사진 삽입 완료: ${photo.src.large}`);
          }
        } else {
          console.log('Pexels: 검색 결과 없음, 사진 없이 저장합니다.');
        }
      } else {
        console.log('Pexels API 응답 오류, 사진 없이 저장합니다.');
      }
    } catch (pexelsErr) {
      console.log('Pexels API 호출 실패, 사진 없이 저장합니다:', pexelsErr.message);
    }
  } else {
    console.log('PEXELS_API_KEY 없음, 사진 없이 저장합니다.');
  }

  // 6. 파일 저장
  try {
    fs.writeFileSync(briefingPath, content, 'utf8');
    console.log(`뉴스 브리핑 저장 완료: ${briefingFilename}`);
  } catch (err) {
    console.log('파일 저장 실패:', err.message);
  }
}

main().catch(err => {
  console.log('예상치 못한 오류 발생:', err.message);
});
