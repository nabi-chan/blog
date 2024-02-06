import { useBlogContext } from "Themes/contexts/blogContext";
import { Link } from "./Link";

export function Header() {
  const { config } = useBlogContext();

  return (
    <header className="sticky top-0 left-0">
      <div className="max-w-3xl mx-auto flex justify-between items-center px-8 py-4">
        <Link href="/" className="font-bold text-2xl">
          {config.header.title}
        </Link>
        <nav>
          <ul className="flex space-x-4">
            {config.header.nav.map((link) => (
              <li key={link.url}>
                <Link
                  href={link.url}
                  title={link.title}
                  className="hover:underline underline-offset-8 text-sky-500"
                >
                  {link.icon}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
