import { ReactNode } from "react";
import { Head } from "Themes/components/Head";
import { Header } from "Themes/components/Header";
import { Footer } from "Themes/components/Footer";
import clsx from "clsx";

interface BaseLayoutProps {
  className?: string;
  children: ReactNode;
}

export function BaseLayout({ children, className }: BaseLayoutProps) {
  return (
    <>
      <Head />
      <Header />
      <main className={clsx("max-w-3xl mx-auto px-8 pt-8", className)}>
        {children}
      </main>
      <Footer />
    </>
  );
}
