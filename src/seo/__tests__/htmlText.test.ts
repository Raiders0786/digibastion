import { describe, expect, it } from 'vitest';
import { htmlToText } from '../htmlText';

describe('htmlToText', () => {
  it('turns headings, paragraphs and lists into plain Markdown-like text', () => {
    expect(htmlToText('<h2>Step</h2><p>A &amp; B</p><ul><li>One</li></ul>')).toBe('## Step\n\nA & B\n\n- One');
  });

  it('drops script and style content', () => {
    expect(htmlToText('<p>Keep</p><script>alert(1)</script><style>p{color:red}</style>')).toBe('Keep');
  });

  it('decodes numeric and named entities', () => {
    expect(htmlToText('<p>&#8217;quote&#x2019; &lt;tag&gt; &quot;x&quot; &nbsp;y</p>')).toBe('’quote’ <tag> "x" y');
  });

  it('strips inline tags and collapses whitespace', () => {
    expect(htmlToText('<div class="a"><p>Use <strong>a   hardware</strong>\n wallet.</p></div><ol><li>One</li><li>Two</li></ol>'))
      .toBe('Use a hardware wallet.\n\n- One\n- Two');
  });

  it('keeps code blocks intact', () => {
    expect(htmlToText('<pre><code>npm audit\nnpm ci</code></pre>')).toBe('```\nnpm audit\nnpm ci\n```');
  });

  it('returns an empty string for empty input', () => {
    expect(htmlToText('')).toBe('');
  });
});
