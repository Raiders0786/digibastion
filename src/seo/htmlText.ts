// Plain text from our own rendered guide HTML, for llms-full.txt. Not a
// sanitizer: the input is trusted markup from renderToStaticMarkup.
// Pure module: no DOM, so it runs in Node, vitest and the Worker.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', middot: '·', rarr: '→', larr: '←', times: '×', copy: '©',
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
}

const stripTags = (html: string): string => html.replace(/<[^>]*>/g, '');

export function htmlToText(html: string): string {
  if (!html) return '';
  const blocks: string[] = [];
  let text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Code blocks keep their line breaks; park them before whitespace is collapsed.
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner: string) => {
      blocks.push(`\`\`\`\n${decodeEntities(stripTags(inner)).replace(/^\n+|\n+$/g, '')}\n\`\`\``);
      return `\n\n\u0000${blocks.length - 1}\u0000\n\n`;
    });

  text = text
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, inner: string) =>
      `\n\n${'#'.repeat(Number(level))} ${stripTags(inner).trim()}\n\n`)
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|header|footer|ul|ol|table|blockquote|dl|figure)>/gi, '\n\n')
    .replace(/<\/li>/gi, '')
    .replace(/<\/(tr|dt|dd)>/gi, '\n')
    .replace(/<\/(td|th)>/gi, ' ');

  text = decodeEntities(stripTags(text))
    .split('\n')
    .map((line) => line.replace(/[ \t\u00A0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text.replace(/\u0000(\d+)\u0000/g, (_, index: string) => blocks[Number(index)] ?? '');
}
