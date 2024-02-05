import NextLink from "next/link";
import { ComponentProps } from "react";

export function Link({
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const url = href.toString();

  if (url.match(/^https?:\/\//) || url.match(/^\/\//)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}
