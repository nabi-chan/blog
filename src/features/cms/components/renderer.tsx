// TODO(@nabi-chan): html-to-ast를 사용하여 AST화된 HTML을 렌더링 하도록 변경하기!
export function Renderer({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
