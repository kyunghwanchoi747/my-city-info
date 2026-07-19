const fs = require('fs');
const path = require('path');
const { quoteFrontmatterColons } = require('./yaml-safe');

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const topicsPath = path.join(process.cwd(), 'public/data/redev-topics.json');
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // posts 디렉토리 확인
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 1. redev-topics.json 읽기
  if (!fs.existsSync(topicsPath)) {
    console.log('redev-topics.json 파일이 없습니다. 종료합니다.');
    return;
  }

  let topics = [];
  try {
    topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
  } catch (err) {
    console.log('redev-topics.json 파싱 실패:', err.message);
    return;
  }

  // done이 false인 첫 번째 주제 선택
  const targetIndex = topics.findIndex(t => t.done === false);
  if (targetIndex === -1) {
    console.log('주제 큐가 비었습니다');
    return;
  }

  const targetTopic = topics[targetIndex].topic;
  console.log(`선택된 주제: "${targetTopic}"`);

  // Gemini API 키 확인
  if (!geminiApiKey) {
    console.log('GEMINI_API_KEY가 없습니다. 종료합니다.');
    return;
  }

  // 2. Gemini에 해설 글 작성 요청
  const prompt = `너는 성남시에 15년째 살고 있는 생활정보 블로거야. 이웃에게 알려주듯 담백하고 신뢰감 있게 글을 써.

재건축 뉴스를 접했지만 용어가 낯선 분당·성남 주민을 위해, 아래 주제에 대한 해설 글을 작성해줘.

주제: ${targetTopic}

[글쓰기 규칙 - 반드시 지켜]
1. 문체: 차분한 존댓말. 느낌표는 글 전체에서 최대 1번만.
2. 금지 표현: "놓치지 마세요", "지금 바로", "꿀팁", "일석이조", "여러분", "~하세요!" 같은 광고 문구와 이모지 전부 금지.
3. 거짓 경험 금지: "제가 직접 신청해봤는데" 같은 지어낸 체험담은 절대 쓰지 마.
4. 중요: 부동산 투자 조언, 가격 전망, 특정 단지 추천은 절대 금지. 제도와 절차 설명만.
5. 도입부: "안녕하세요"로 시작하지 마. 일상적인 관찰이나 이 개념이 왜 지금 주목받는지로 자연스럽게 시작해.
6. 구조: 개념 정의 → 왜 중요한가 → 분당·성남 상황과의 연결 → 자주 묻는 질문 2~3개 순서로 작성. 각 단락은 소제목(##)으로 구분해.
7. 분량: 1200자 이상.
8. 오늘 날짜는 ${todayStr}이다. 계절이나 시기를 언급할 때는 반드시 이 날짜에 맞게 써.
9. 글 마지막에 반드시 다음 문구를 추가해: "재건축·재개발 관련 구체적 사항은 성남시청 및 국토교통부 공식 발표를 확인하시기 바랍니다."

## 아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:

---
title: (주제를 자연스럽게 풀어쓴 제목)
date: ${todayStr}
summary: (한 줄 요약)
category: 재개발
tags: [태그1, 태그2, 태그3]
---

(본문: 1200자 이상, 위의 글쓰기 규칙 준수)

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.
그 다음 줄에 PHOTO: (글 주제를 대표하는 영어 사진 검색어 1~2단어) 형식으로 출력해줘. 예: PHOTO: apartment building. 검색어는 사진 사이트에서 검색할 구체적인 사물이나 풍경 단어로.`;

  console.log('Gemini에 재개발 해설 글 작성 요청 중...');
  let text = '';
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!geminiRes.ok) throw new Error(`Gemini API returned status ${geminiRes.status}`);
    const geminiData = await geminiRes.json();
    text = geminiData.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.log('Gemini API 호출 실패, 종료합니다:', err.message);
    return;
  }

  // 3. FILENAME 추출
  const filenameMatch = text.match(/FILENAME:\s*([^\s\n\r]+)/i);
  if (!filenameMatch) {
    console.log('Error: Gemini가 FILENAME 태그를 출력하지 않았습니다. 종료합니다.');
    return;
  }

  let filename = filenameMatch[1].trim();
  if (!filename.endsWith('.md')) filename += '.md';

  // PHOTO 키워드 추출
  const photoMatch = text.match(/PHOTO:\s*([^\n\r]+)/i);
  const photoKeyword = photoMatch ? photoMatch[1].trim() : null;

  // FILENAME, PHOTO 줄 제거
  let content = text
    .replace(/FILENAME:\s*[^\s\n\r]+/i, '')
    .replace(/PHOTO:\s*[^\n\r]+/i, '')
    .trim();

  // 코드블록 래핑 제거
  if (content.startsWith('```')) {
    content = content.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
  }

  // 3. Pexels 사진 삽입
  if (pexelsApiKey && photoKeyword) {
    try {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(photoKeyword)}&per_page=1&orientation=landscape`;
      const pexelsRes = await fetch(pexelsUrl, { headers: { Authorization: pexelsApiKey } });
      if (pexelsRes.ok) {
        const pexelsData = await pexelsRes.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          const photo = pexelsData.photos[0];
          const photoMarkdown = `![${photo.alt || photoKeyword}](${photo.src.large})\n*사진: [${photo.photographer}](${photo.photographer_url}), Pexels 제공*`;
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
    if (!pexelsApiKey) console.log('PEXELS_API_KEY 없음, 사진 없이 저장합니다.');
    if (!photoKeyword) console.log('PHOTO 키워드 없음, 사진 없이 저장합니다.');
  }

  // 4. 파일 저장
  const outPath = path.join(postsDir, filename);
  try {
    fs.writeFileSync(outPath, quoteFrontmatterColons(content), 'utf8');
    console.log(`재개발 해설 글 저장 완료: ${filename}`);
  } catch (err) {
    console.log('파일 저장 실패:', err.message);
    return;
  }

  // 4. 저장 성공 시 done을 true로 업데이트
  try {
    topics[targetIndex].done = true;
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2), 'utf8');
    console.log(`주제 완료 처리: "${targetTopic}"`);
  } catch (err) {
    console.log('redev-topics.json 업데이트 실패:', err.message);
  }
}

main().catch(err => {
  console.log('예상치 못한 오류 발생:', err.message);
});
