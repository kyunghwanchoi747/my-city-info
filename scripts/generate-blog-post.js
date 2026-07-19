const fs = require('fs');
const path = require('path');
const { quoteFrontmatterColons } = require('./yaml-safe');

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not defined.');
    process.exit(1);
  }

  const localInfoPath = path.join(process.cwd(), 'public/data/city-info.json');
  const postsDir = path.join(process.cwd(), 'src/content/posts');

  // Ensure posts directory exists
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 1. Load local info data
  if (!fs.existsSync(localInfoPath)) {
    console.error('Error: city-info.json does not exist.');
    process.exit(1);
  }

  let localInfo = [];
  try {
    localInfo = JSON.parse(fs.readFileSync(localInfoPath, 'utf8'));
  } catch (e) {
    console.error('Error parsing city-info.json:', e);
    process.exit(1);
  }

  if (localInfo.length === 0) {
    console.error('Error: city-info.json is empty.');
    process.exit(1);
  }

  // Get the last item
  const targetItem = localInfo[localInfo.length - 1];
  console.log(`Checking existing posts for: "${targetItem.name}"`);

  // Check if a post with the same name already exists
  const existingFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  let alreadyWritten = false;
  for (const file of existingFiles) {
    const fileContent = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const titleMatch = fileContent.match(/title:\s*["']?([^"\n\r']+)["']?/);
    const hasNameMatch = titleMatch && (titleMatch[1].includes(targetItem.name) || targetItem.name.includes(titleMatch[1]));
    if (hasNameMatch || fileContent.includes(targetItem.name)) {
      alreadyWritten = true;
      break;
    }
  }

  if (alreadyWritten) {
    console.log('이미 작성된 글입니다');
    process.exit(0);
  }

  // 2. Request Gemini to generate blog post
  const todayStr = new Date().toISOString().split('T')[0];
  const prompt = `너는 성남시에 15년째 살고 있는 생활정보 블로거야. 이웃에게 알려주듯 담백하고 신뢰감 있게 글을 써.

아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(targetItem, null, 2)}

[글쓰기 규칙 - 반드시 지켜]
1. 문체: 차분한 존댓말. 느낌표는 글 전체에서 최대 1번만.
2. 금지 표현: "놓치지 마세요", "지금 바로", "꿀팁", "일석이조", "여러분", "~하세요!" 같은 광고 문구와 이모지 전부 금지.
3. 거짓 경험 금지: "제가 직접 신청해봤는데" 같은 지어낸 체험담은 절대 쓰지 마. 대신 이 정보를 보고 든 생각이나 어떤 상황의 주민에게 필요할지에 대한 의견은 써도 돼.
4. 성남 맥락: 분당, 판교, 수정구, 중원구 등 성남의 실제 지역 상황과 자연스럽게 연결해. 관련이 없으면 억지로 끼워넣지 마.
5. 도입부: "안녕하세요"로 시작하지 마. 계절, 시기, 일상적인 관찰 등 매번 다른 방식으로 시작해.
6. 실용 정보: 신청 전 확인할 점, 헷갈리기 쉬운 조건, 준비물 등 독자가 실제로 궁금해할 내용을 소제목(##) 2~3개로 정리해.
7. 분량: 1000자 이상.
8. 글 마지막에 정보 출처(공공데이터포털 등)와 공식 링크를 명시해.
9. 오늘 날짜는 ${todayStr}이다. 계절이나 시기를 언급할 때는 반드시 이 날짜에 맞게 써.

## 아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:

---
title: (제목)
date: ${todayStr}
summary: (한 줄 요약)
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문: 1000자 이상, 위의 글쓰기 규칙 준수)

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.
그 다음 줄에 PHOTO: (글 주제를 대표하는 영어 사진 검색어 1~2단어) 형식으로 출력해줘. 예: PHOTO: fishing boat. 검색어는 사진 사이트에서 검색할 구체적인 사물이나 풍경 단어로.`;

  console.log('Requesting Gemini to generate the blog post...');
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

  let text = '';
  try {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned error code ${res.status}`);
    }

    const result = await res.json();
    text = result.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error generating blog post with Gemini:', error);
    process.exit(1);
  }

  // 3. Extract FILENAME and clean content
  const filenameMatch = text.match(/FILENAME:\s*([^\s\n\r]+)/i);
  if (!filenameMatch) {
    console.error('Error: Gemini did not output FILENAME tag.');
    process.exit(1);
  }

  let filename = filenameMatch[1].trim();
  if (!filename.endsWith('.md')) {
    filename += '.md';
  }

  // Extract PHOTO keyword and remove the PHOTO line from content
  const photoMatch = text.match(/PHOTO:\s*([^\n\r]+)/i);
  const photoKeyword = photoMatch ? photoMatch[1].trim() : null;

  // Remove the FILENAME and PHOTO lines from the final content
  let content = text
    .replace(/FILENAME:\s*[^\s\n\r]+/i, '')
    .replace(/PHOTO:\s*[^\n\r]+/i, '')
    .trim();

  // Strip codeblock backticks if Gemini wrapped it
  if (content.startsWith('```')) {
    content = content.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim();
  }

  // Handle case where Gemini literally outputs "## title:" instead of "---" yaml frontmatter
  if (content.includes('## title:')) {
    const lines = content.split('\n');
    const frontmatterLines = ['---'];
    let inFrontmatter = true;
    const bodyLines = [];

    for (const line of lines) {
      if (inFrontmatter) {
        const trimmed = line.trim();
        if (trimmed.startsWith('## title:')) {
          frontmatterLines.push(trimmed.replace('## ', ''));
        } else if (trimmed.startsWith('date:') || trimmed.startsWith('summary:') || trimmed.startsWith('category:') || trimmed.startsWith('tags:')) {
          frontmatterLines.push(trimmed);
        } else if (trimmed === '' && frontmatterLines.length > 1) {
          frontmatterLines.push('---');
          inFrontmatter = false;
        } else if (trimmed !== '') {
          frontmatterLines.push('---');
          inFrontmatter = false;
          bodyLines.push(line);
        }
      } else {
        bodyLines.push(line);
      }
    }
    content = [...frontmatterLines, '', ...bodyLines].join('\n');
  }

  // 4. Fetch photo from Pexels and insert into content
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  if (pexelsApiKey && photoKeyword) {
    try {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(photoKeyword)}&per_page=1&orientation=landscape`;
      const pexelsRes = await fetch(pexelsUrl, {
        headers: { Authorization: pexelsApiKey }
      });
      if (pexelsRes.ok) {
        const pexelsData = await pexelsRes.json();
        if (pexelsData.photos && pexelsData.photos.length > 0) {
          const photo = pexelsData.photos[0];
          const photoMarkdown = `![${photo.alt || photoKeyword}](${photo.src.large})\n*사진: [${photo.photographer}](${photo.photographer_url}), Pexels 제공*`;
          // Insert photo block right after the closing --- of frontmatter
          const frontmatterEnd = content.indexOf('---', 3);
          if (frontmatterEnd !== -1) {
            const afterFrontmatter = content.slice(frontmatterEnd + 3).trimStart();
            content = content.slice(0, frontmatterEnd + 3) + '\n\n' + photoMarkdown + '\n\n' + afterFrontmatter;
            console.log(`Photo inserted from Pexels: ${photo.src.large}`);
          }
        } else {
          console.log('Pexels: no photos found for keyword:', photoKeyword);
        }
      } else {
        console.log('Pexels API returned non-OK status:', pexelsRes.status);
      }
    } catch (pexelsError) {
      console.log('Pexels API call failed, skipping photo:', pexelsError.message);
    }
  } else {
    if (!pexelsApiKey) console.log('PEXELS_API_KEY not set, skipping photo.');
    if (!photoKeyword) console.log('No PHOTO keyword from Gemini, skipping photo.');
  }

  // Save the file
  const outPath = path.join(postsDir, filename);
  try {
    fs.writeFileSync(outPath, quoteFrontmatterColons(content), 'utf8');
    console.log(`Successfully generated and saved blog post: ${filename}`);
  } catch (error) {
    console.error('Error saving blog post file:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error in generate-blog-post:', err);
  process.exit(1);
});
