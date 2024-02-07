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

        console.log('element.children.length', element.children.length);

        if (element.children.length > 1) {
          element.replaceChild(script, element.children[0]);
        }

        if (element.children.length === 0) {
          element.appendChild(script);
        }
      }}
    />
  );
}
