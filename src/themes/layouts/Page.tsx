import { ReactNode } from 'react';
import { BaseLayout } from './Base';
import { MDXRenderer } from '../components/MdxRenderer';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <BaseLayout>
      <MDXRenderer>{children}</MDXRenderer>
    </BaseLayout>
  );
}
