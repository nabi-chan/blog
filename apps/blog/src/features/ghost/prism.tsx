import Script from 'next/script'

const prism = new URL(
  'https://cdn.jsdelivr.net/npm/prismjs/prism.min.js',
  import.meta.url
)
const autoLoader = new URL(
  'https://cdn.jsdelivr.net/npm/prismjs/plugins/autoloader/prism-autoloader.min.js',
  import.meta.url
)

export default function Prism() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `code[class*=language-],pre[class*=language-]{color:#c5c8c6;text-shadow:0 1px rgba(0,0,0,.3);font-family:Inconsolata,Monaco,Consolas,'Courier New',Courier,monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto;border-radius:.3em}:not(pre)>code[class*=language-],pre[class*=language-]{background:#1d1f21}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#7c7c7c}.token.punctuation{color:#c5c8c6}.namespace{opacity:.7}.token.keyword,.token.property,.token.tag{color:#96cbfe}.token.class-name{color:#ffffb6;text-decoration:underline}.token.boolean,.token.constant{color:#9c9}.token.deleted,.token.symbol{color:#f92672}.token.number{color:#ff73fd}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string{color:#a8ff60}.token.variable{color:#c6c5fe}.token.operator{color:#ededed}.token.entity{color:#ffffb6;cursor:help}.token.url{color:#96cbfe}.language-css .token.string,.style .token.string{color:#87c38a}.token.atrule,.token.attr-value{color:#f9ee98}.token.function{color:#dad085}.token.regex{color:#e9c062}.token.important{color:#fd971f}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}`,
        }}
      />
      <Script
        src={prism.pathname}
        defer
      />
      <Script
        src={autoLoader.pathname}
        defer
      />
    </>
  )
}
