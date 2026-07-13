const fs = require('fs');
const path = require('path');

async function main() {
  const publicDataApiKey = process.env.PUBLIC_DATA_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!publicDataApiKey) {
    console.error('Error: PUBLIC_DATA_API_KEY environment variable is not defined.');
    process.exit(1);
  }
  if (!geminiApiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not defined.');
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), 'public/data/city-info.json');

  // Load existing data
  let existingItems = [];
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      existingItems = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse existing city-info.json, keeping it as empty array:', e);
    }
  }

  // 1. Fetch public data
  console.log('Fetching public data from ODCloud...');
  const publicDataUrl = `https://api.odcloud.kr/api/gov24/v3/serviceList?page=1&perPage=20&returnType=JSON&serviceKey=${encodeURIComponent(publicDataApiKey)}`;
  
  let items = [];
  try {
    const res = await fetch(publicDataUrl, {
      headers: {
        'Authorization': `Infuser ${publicDataApiKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    items = json.data || [];
  } catch (error) {
    console.error('Error fetching public data:', error);
    process.exit(1);
  }

  if (items.length === 0) {
    console.log('No items returned from API.');
    process.exit(0);
  }

  // Filter helper
  const matches = (item, keyword) => {
    const checkKeys = [
      '서비스명', '서비스목적요약', '지원대상', '소관기관명',
      'serviceNm', 'servicePurpose', 'supportTarget', 'orgNm', 'orgName'
    ];
    return checkKeys.some(key => {
      const val = item[key];
      return val && String(val).includes(keyword);
    });
  };

  // Filter hierarchy
  let filtered = items.filter(item => matches(item, '성남'));
  if (filtered.length === 0) {
    console.log('No "성남" items found. Filtering by "경기"...');
    filtered = items.filter(item => matches(item, '경기'));
  }
  if (filtered.length === 0) {
    console.log('No "경기" items found. Using all items...');
    filtered = items;
  }

  // Filter out already existing items by name
  const existingNames = new Set(existingItems.map(x => x.name));
  const newItems = filtered.filter(item => {
    const name = item['서비스명'] || item['serviceNm'] || item['title'] || item['name'] || '';
    return name && !existingNames.has(name);
  });

  if (newItems.length === 0) {
    console.log('새로운 데이터가 없습니다');
    process.exit(0);
  }

  // Get the first new item
  const targetItem = newItems[0];
  const targetName = targetItem['서비스명'] || targetItem['serviceNm'] || '새로운 서비스';
  console.log(`Processing item: ${targetName}`);

  // 3. Request Gemini to process the item
  const prompt = `아래 공공데이터 1건을 분석해서 JSON 객체로 변환해줘. 형식:
{id: 숫자, name: 서비스명, category: '행사' 또는 '혜택', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', location: 장소 또는 기관명, target: 지원대상, summary: 한줄요약, link: 상세URL}
category는 내용을 보고 행사/축제면 '행사', 지원금/서비스면 '혜택'으로 판단해.
startDate가 없으면 오늘 날짜, endDate가 없으면 '상시'로 넣어.
반드시 JSON 객체만 출력해. 다른 텍스트 없이.

공공데이터:
${JSON.stringify(targetItem, null, 2)}`;

  console.log('Requesting Gemini to process the item...');
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  
  let processedItem;
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
    let text = result.candidates[0].content.parts[0].text.trim();
    
    // Remove markdown codeblock formatting if present
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    processedItem = JSON.parse(text);
  } catch (error) {
    console.error('Error processing data with Gemini:', error);
    process.exit(1);
  }

  // Set unique ID in Javascript to guarantee safety
  const categoryKey = processedItem.category === '행사' ? 'event' : 'benefit';
  const categoryItems = existingItems.filter(x => String(x.id).startsWith(categoryKey));
  const maxNum = categoryItems.reduce((max, item) => {
    const num = parseInt(String(item.id).split('-')[1]);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  processedItem.id = `${categoryKey}-${maxNum + 1}`;

  // Append new item to existing list
  existingItems.push(processedItem);

  // Write back to file safely
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(existingItems, null, 2), 'utf8');
    console.log(`Successfully added: ${processedItem.name} (ID: ${processedItem.id})`);
  } catch (error) {
    console.error('Failed to save to city-info.json:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error in main process:', err);
  process.exit(1);
});
