export function Comment() {
  return (
    <aside
      ref={(element) => {
        if (!element) {
          return;
        }

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://utteranc.es/client.js";
        script.setAttribute("repo", "nabi-chan/comments");
        script.setAttribute("issue-term", "title");
        script.setAttribute("theme", "preferred-color-scheme");
        script.setAttribute("crossorigin", "anonymous");

        if (element.children.length === 0) {
          element.appendChild(script);
        }
      }}
    />
  );
}
