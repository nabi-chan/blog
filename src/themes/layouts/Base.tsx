import { ReactNode } from "react";
import { Head } from "Themes/components/Head";
import { Header } from "Themes/components/Header";
import { Footer } from "Themes/components/Footer";
import { MDXRenderer } from "Themes/components/MdxRenderer";

interface BaseLayoutProps {
  children: ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <>
      <Head />
      <Header />
      <main className="container mx-auto px-8">
        <MDXRenderer>{children}</MDXRenderer>
      </main>
      <Footer />
    </>
  );
}
