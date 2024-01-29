import Link from "next/link";
import { Code, Pre, Table, Td, Th, Tr } from "nextra/components";
import { MDXProvider } from "nextra/mdx";
import type { Components } from "nextra/mdx";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import clsx from "clsx";

function HeadingLink({
  tag: Tag,
  children,
  id,
  className,
  ...props
}: ComponentProps<"h1"> & { tag: `h${1 | 2 | 3 | 4 | 5 | 6}` }): ReactElement {
  return (
    <Tag className={clsx(className === "sr-only" && "nx-sr-only")} {...props}>
      {children}
      {id && (
        <a
          href={`#${id}`}
          id={id}
          className="subheading-anchor"
          aria-label="Permalink for this section"
        />
      )}
    </Tag>
  );
}

const EXTERNAL_HREF_REGEX = /https?:\/\//;

const A = ({ children, href = "", ...props }: ComponentProps<"a">) => {
  if (EXTERNAL_HREF_REGEX.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
        <span className="nx-sr-only nx-select-none"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} passHref legacyBehavior>
      <a {...props}>{children}</a>
    </Link>
  );
};

const useComponents = (): Components => {
  return {
    h1: (props) => <HeadingLink tag="h1" {...props} />,
    h2: (props) => <HeadingLink tag="h2" {...props} />,
    h3: (props) => <HeadingLink tag="h3" {...props} />,
    h4: (props) => <HeadingLink tag="h4" {...props} />,
    h5: (props) => <HeadingLink tag="h5" {...props} />,
    h6: (props) => <HeadingLink tag="h6" {...props} />,
    a: A,
    pre: ({ children, ...props }) => (
      <div className="nx-not-prose">
        <Pre {...props}>{children}</Pre>
      </div>
    ),
    tr: Tr,
    th: Th,
    td: Td,
    table: (props) => <Table className="nx-not-prose" {...props} />,
    code: Code,
  };
};

export const MDXTheme = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  return <MDXProvider components={useComponents()}>{children}</MDXProvider>;
};
