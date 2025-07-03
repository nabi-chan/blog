import { Anchor as MantineAnchor } from "@mantine/core"
import { Link } from "react-router"
import type { AnchorProps } from "@mantine/core"

type Props = AnchorProps & {
  href: string
  children: React.ReactNode
}

export function Anchor({ href, children, ...props }: Props) {
  if (href.match(/^https?:\/\//)) {
    return (
      <MantineAnchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}>
        {children}
      </MantineAnchor>
    )
  }

  return (
    <MantineAnchor component={Link} to={href} {...props}>
      {children}
    </MantineAnchor>
  )
}
