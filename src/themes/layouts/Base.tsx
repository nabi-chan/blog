import { ReactNode } from "react";
import { useBlogContext } from "Themes/contexts/blogContext";
import { Head } from "Themes/components/Head";

interface BaseLayoutProps {
  children: ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <>
      <Head />
      <main className="container mx-auto px-8">{children}</main>
    </>
  );
}
