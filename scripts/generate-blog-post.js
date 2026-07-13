const fs = require('fs');
const path = require('path');

async function main() {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not defined.');
    process.exit(1);
  }

  const localInfoPath = path.join(process.cwd(), 'public/data/local-info.json');
  const postsDir = path.join(process.cwd(), 'src/content/posts');

  // Ensure posts directory exists
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 1. Load local info data
  if (!fs.existsSync(localInfoPath)) {
    console.error('Error: local-info.json does not exist.');
    process.exit(1);
  }

  let localInfo = [];
  try {
    localInfo = JSON.parse(fs.readFileSync(localInfoPath, 'utf8'));
  } catch (e) {
    console.error('Error parsing local-info.json:', e);
    process.exit(1);
  }

  if (localInfo.length === 0) {
    console.error('Error: local-info.json is empty.');
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
    if (titleMatch && titleMatch[1].trim() === targetItem.name.trim()) {
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
  const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(targetItem, null, 2)}

## 아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:

---
title: (친근하고 흥미로운 제목)
date: ${todayStr}
summary: (한 줄 요약)
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문: 800자 이상, 친근한 블로그 톤, 추천 이유 3가지 포함, 신청 방법 안내)

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.`;

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

  // Remove the FILENAME line from the final content
  let content = text.replace(/FILENAME:\s*[^\s\n\r]+/i, '').trim();

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

  // Save the file
  const outPath = path.join(postsDir, filename);
  try {
    fs.writeFileSync(outPath, content, 'utf8');
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
