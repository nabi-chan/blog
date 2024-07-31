import { NavGroup, NavItem, Text, VStack } from '@channel.io/bezier-react'
import Link from 'next/link'
import { useState } from 'react'
import { ADMIN_SIDEBAR_LINKS } from './constants'

export function Sidebar() {
  const [openedNavGroup, setOpenedNavGroup] = useState<string[]>([])

  return (
    <VStack
      padding={16}
      width="240px"
      height="100vh"
      overflowY="auto"
      backgroundColor="bg-black-lightest"
      borderRightWidth={1}
      borderColor="bdr-black-light"
      spacing={8}
    >
      <Text bold>🐈 cat-house-admin</Text>

      {ADMIN_SIDEBAR_LINKS.map((SIDEBAR_LINK) => (
        <NavGroup
          open={openedNavGroup.includes(SIDEBAR_LINK.slug)}
          onClick={() => {
            if (openedNavGroup.includes(SIDEBAR_LINK.slug)) {
              return setOpenedNavGroup(
                openedNavGroup.filter((slug) => slug !== SIDEBAR_LINK.slug)
              )
            }

            setOpenedNavGroup([...openedNavGroup, SIDEBAR_LINK.slug])
          }}
          key={SIDEBAR_LINK.slug}
          name={SIDEBAR_LINK.slug}
          leftContent={SIDEBAR_LINK.icon}
          content={SIDEBAR_LINK.title}
        >
          {SIDEBAR_LINK.links.map((LINK) => (
            <Link
              key={`${SIDEBAR_LINK.slug}${LINK.href}`}
              href={`${SIDEBAR_LINK.slug}${LINK.href}`}
            >
              <NavItem
                name={`${SIDEBAR_LINK.slug}${LINK.href}`}
                content={LINK.title}
              />
            </Link>
          ))}
        </NavGroup>
      ))}
    </VStack>
  )
}
