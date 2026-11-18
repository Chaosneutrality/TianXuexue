import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// Sanitize untrusted HTML before trusted plugins generate KaTeX and highlighting.
// Keep the classes consumed by those plugins, not arbitrary HTML attributes.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', 'math-inline', 'math-display', /^language-./],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className', 'math', 'math-inline', 'math-display'],
    ],
    // 只放行对话气泡这两个固定类名，其余 class 仍会被剥掉
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', 'chat-left', 'chat-right', 'chat-image'],
    ],
    p: [
      ...(defaultSchema.attributes?.p || []),
      ['className', 'chat-left', 'chat-right'],
    ],
  },
};

// Keep fragment links to this document working after the sanitizer prefixes
// IDs. Do not rewrite links to other pages or IDs outside the Markdown.
function fixFragmentLinks() {
  return (tree) => {
    const prefix = schema.clobberPrefix;
    const ids = new Set();
    const links = [];
    function visit(node) {
      if (node.type === 'element') {
        const { id, href } = node.properties;
        if (typeof id === 'string' && id.startsWith(prefix)) ids.add(id);
        if (node.tagName === 'a' && typeof href === 'string' && href.startsWith('#') && href.length > 1) {
          links.push(node);
        }
      }
      if (node.children) node.children.forEach(visit);
    }
    visit(tree);
    for (const link of links) {
      let fragment = link.properties.href.slice(1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        // Keep malformed escapes literal.
      }
      const id = prefix + fragment;
      if (ids.has(id)) link.properties.href = '#' + encodeURIComponent(id);
    }
  };
}

// ============================================================
// 对话气泡：正文里出现"行尾 r"或"行尾 l"就认为这是对话体
//   行尾 r → 右侧绿气泡；行尾 l → 左侧白气泡（标记自动去掉）
//   没标记的行 → 走标记的反面（用 r 的篇章默认左边，用 l 的篇章默认右边）
// 没有 r / l 标记的文章完全不受影响；标题、列表、引用等保持原样。
// ============================================================
const NOT_CHAT_LINE = /^\s*(?:#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\||```|~~~|<|:::)/u;
const IMAGE_ONLY = /^(?:\s*!\[[^\]]*\]\([^()\s]+\)\s*)+$/u;

// 行尾标记：r = 右（绿），l = 左（白）。
// 标记前一位只要是中文/空格/标点都算；只有英文字母或数字结尾（for、girl）不当标记。
function splitMark(line) {
  const t = line.replace(/\s+$/, '');
  if (!/[rl]$/.test(t)) return null;
  const body = t.slice(0, -1);
  const prev = body.slice(-1);
  if (prev === '' || /[A-Za-z0-9]/.test(prev)) return null;
  const text = body.trim();
  if (text === '') return null;
  return { side: t.endsWith('r') ? 'right' : 'left', text };
}

// 气泡里是原生 HTML，Markdown 语法不会被解析，这里把链接/图片手动转成 HTML
function inlineToHtml(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^()\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^()\s]+)\)/g, '<a href="$2">$1</a>');
}

function applyChatBubbles(markdown) {
  const unescapeInline = (s) => s.replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, '$1').trim();

  const lines = markdown.split(/\r?\n/);
  const marks = lines
    .map((line) => line.trim())
    .filter((t) => t !== '' && !NOT_CHAT_LINE.test(t))
    .map((t) => splitMark(t))
    .filter(Boolean)
    .map((m) => m.side);

  if (marks.length === 0) return markdown;

  const rightCount = marks.filter((m) => m === 'right').length;
  const leftCount = marks.filter((m) => m === 'left').length;
  const defaultSide = rightCount >= leftCount ? 'left' : 'right';

  // 行尾 + 表示"连接下一句"：合并进同一个气泡，内部用 <br> 换行
  const CONTINUES = /[+＋]$/;

  const out = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const text = raw.trim();

    if (text === '') {
      out.push('');
      i++;
      continue;
    }
    if (NOT_CHAT_LINE.test(text)) {
      out.push(raw);
      i++;
      continue;
    }

    // 收集这一句（可能由多行用 + 连成）
    const parts = [];
    let side = null;
    let keepGoing = true;
    while (keepGoing && i < lines.length) {
      const cur = lines[i].trim();
      if (cur === '') {
        i++;
        continue; // 加号续行时允许跨过空行
      }
      if (NOT_CHAT_LINE.test(cur)) break;

      const cont = CONTINUES.test(cur);
      const piece = cont ? cur.slice(0, -1).trim() : cur;
      const mark = splitMark(piece);
      if (mark) side = mark.side;
      parts.push(unescapeInline(mark ? mark.text : piece));

      i++;
      keepGoing = cont;
      if (keepGoing) {
        while (i < lines.length && lines[i].trim() === '') i++;
      }
    }

    const finalSide = side || defaultSide;
    const joined = parts.join('<br>');

    if (parts.length > 0 && parts.every((p) => IMAGE_ONLY.test(p))) {
      out.push(`<div class="chat-${finalSide} chat-image">${inlineToHtml(joined)}</div>`);
    } else {
      out.push(`<div class="chat-${finalSide}">${inlineToHtml(joined)}</div>`);
    }
  }
  return out.join('\n\n');
}

export async function renderMarkdown(content) {
  const prepared = applyChatBubbles(content);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(fixFragmentLinks)
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'],
    })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(prepared);
  return processed.toString();
}
