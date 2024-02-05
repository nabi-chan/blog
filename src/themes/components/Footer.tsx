import { useBlogContext } from "Themes/contexts/blogContext";
import { capitalize } from "lodash-es";
import { Link } from "./Link";

export function Footer() {
  const { config } = useBlogContext();

  return (
    <footer>
      <div className="container mx-auto px-8 pt-12 pb-4 flex justify-between items-center text-sm text-slate-700">
        <Link
          href={`https://github.com/${config.footer.githubUserName}`}
          className="hover:underline underline-offset-4"
        >
          @{config.footer.githubUserName}
        </Link>
        <ul className="flex space-x-3">
          {config.footer.links.map((link) => (
            <li key={link.url}>
              <Link
                href={link.url}
                className="hover:underline underline-offset-4"
              >
                {capitalize(link.title)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
