import Script from 'next/script'

const prism = new URL(
  'https://cdn.jsdelivr.net/npm/prismjs/prism.min.js',
  import.meta.url
)
const autoLoader = new URL(
  'https://cdn.jsdelivr.net/npm/prismjs/plugins/autoloader/prism-autoloader.min.js',
  import.meta.url
)
const atomDark = new URL(
  'https://cdnjs.cloudflare.com/ajax/libs/prism-themes/1.5.0/prism-atom-dark.min.css',
  import.meta.url
)

export default function Prism() {
  return (
    <>
      <Script stylesheets={[atomDark.pathname]} />
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
