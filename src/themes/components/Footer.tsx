import { useBlogContext } from 'Themes/contexts/blogContext';
import { Link } from './Link';
import { useTheme } from 'next-themes';

export function Footer() {
  const { config } = useBlogContext();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <footer className="print:hidden">
      <div className="max-w-3xl mx-auto px-8 pt-12 pb-4 flex justify-between items-center text-sm text-zinc-500">
        <Link
          href={`https://github.com/${config.footer.githubUserName}`}
          className="hover:underline underline-offset-4"
        >
          @{config.footer.githubUserName}
        </Link>
        <ul className="divide-bullet">
          {config.footer.links.map((link) => (
            <li key={link.url}>
              <Link href={link.url} className="hover:underline underline-offset-4 capitalize">
                {link.title}
              </Link>
            </li>
          ))}
          <li>
            <button className="capitalize" onClick={toggleTheme}>
              switch theme
            </button>
          </li>
        </ul>
      </div>
    </footer>
  );
}
