import Link from "next/link";
import { useBlogContext } from "Themes/contexts/blogContext";

export function Header() {
  const { config } = useBlogContext();

  return (
    <header className="sticky top-0 left-0">
      <div className="container mx-auto flex justify-between items-center px-8 py-4">
        <Link href="/" className="font-bold text-2xl">
          {config.header.title}
        </Link>
      </div>
    </header>
  );
}
