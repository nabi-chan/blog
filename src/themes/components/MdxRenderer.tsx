import { Code, Pre, Table, Td, Th, Tr } from 'nextra/components';
import { MDXProvider } from 'nextra/mdx';
import type { Components } from 'nextra/mdx';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Link } from './Link';

function HeadingLink({
  tag: Tag,
  children,
  id,
  className,
  ...props
}: ComponentProps<'h1'> & { tag: `h${1 | 2 | 3 | 4 | 5 | 6}` }): ReactElement {
  return (
    <Tag {...props}>
      {children}
      {id && <a href={`#${id}`} id={id} className="subheading-anchor" aria-label="Permalink for this section" />}
    </Tag>
  );
}

const useComponents = (): Components => {
  return {
    h1: (props) => <HeadingLink tag="h1" {...props} />,
    h2: (props) => <HeadingLink tag="h2" {...props} />,
    h3: (props) => <HeadingLink tag="h3" {...props} />,
    h4: (props) => <HeadingLink tag="h4" {...props} />,
    h5: (props) => <HeadingLink tag="h5" {...props} />,
    h6: (props) => <HeadingLink tag="h6" {...props} />,
    a: Link,
    pre: Pre,
    tr: Tr,
    th: Th,
    td: Td,
    table: Table,
    code: Code,
  };
};

export const MDXRenderer = ({ children }: { children: ReactNode }): ReactElement => {
  return (
    <MDXProvider components={useComponents()}>
      <article className="markdown">{children}</article>
    </MDXProvider>
  );
};
