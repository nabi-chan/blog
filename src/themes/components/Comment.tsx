import { useTheme } from 'next-themes';

export function Comment() {
  const { theme } = useTheme();

  return (
    <aside
      ref={(element) => {
        if (!element) {
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://utteranc.es/client.js';
        script.setAttribute('repo', 'nabi-chan/comments');
        script.setAttribute('issue-term', 'title');
        script.setAttribute('theme', theme === 'dark' ? 'github-dark' : 'github-light');
        script.setAttribute('crossorigin', 'anonymous');

        if (element.children.length === 0) {
          element.appendChild(script);
        } else {
          element.replaceChild(script, element.children[0]);
        }
      }}
    />
  );
}
