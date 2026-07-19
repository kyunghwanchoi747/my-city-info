// frontmatter의 title/summary 값에 콜론(:)이 있으면 YAML 파싱이 깨지므로 저장 전에 따옴표로 감싼다
function quoteFrontmatterColons(content) {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('---', 3);
  if (end === -1) return content;
  const front = content.slice(0, end);
  const fixed = front.replace(/^(title|summary):[ \t]*([^"'\n][^\n]*)$/gm, (line, key, val) => {
    if (!val.includes(':')) return line;
    return `${key}: "${val.trim().replace(/"/g, '\\"')}"`;
  });
  return fixed + content.slice(end);
}

module.exports = { quoteFrontmatterColons };
