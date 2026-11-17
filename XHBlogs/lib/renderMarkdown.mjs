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
      ['className', 'chat-left', 'chat-right'],
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
// 对话气泡：正文里只要有"行尾 r"的行，就认为这是对话体
//   行尾 r → 右侧绿气泡（r 自动去掉）
//   其余行 → 左侧白气泡
// 没有 r 的文章完全不受影响；标题/列表/图片/引用等非纯文本行保持原样。
// ============================================================
const CHAT_RIGHT = /^(.*?)(?:\s+|(?<=[，。！？；：、…—）》”】」』~]))r\s*$/u;
const PLAIN_LINE = /^(?!\s*(?:#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\||```|~~~|!\[|<|:::))/u;

function applyChatBubbles(markdown) {
  if (!/r\s*$/m.test(markdown)) return markdown;

  // 气泡里是原生 HTML，不再走 Markdown 转义，这里把多余的反斜杠还原
  const unescapeInline = (s) => s.replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, '$1').trim();

  const lines = markdown.split(/\r?\n/);
  // 至少有一行是"行尾 r"的纯文本行，才判定为对话体
  const hasMarker = lines.some((line) => line.trim() !== '' && PLAIN_LINE.test(line) && CHAT_RIGHT.test(line.trim()));
  if (!hasMarker) return markdown;

  const out = [];
  for (const line of lines) {
    const text = line.trim();
    if (text === '') {
      out.push('');
      continue;
    }
    if (!PLAIN_LINE.test(text)) {
      out.push(line);
      continue;
    }
    const right = text.match(CHAT_RIGHT);
    if (right) {
      out.push(`<div class="chat-right">${unescapeInline(right[1])}</div>`);
    } else {
      out.push(`<div class="chat-left">${unescapeInline(text)}</div>`);
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
