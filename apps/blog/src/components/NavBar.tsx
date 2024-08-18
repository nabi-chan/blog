import { MenuIcon, MoonIcon, WeatherSunIcon } from '@channel.io/bezier-icons'
import {
  Box,
  Button,
  HStack,
  ListItem,
  Overlay,
  Text,
  VStack,
} from '@channel.io/bezier-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useTheme } from 'Providers/ThemeProvider/useTheme'

interface NavbarProps {
  title: string
  navigation: Array<{ url: string; label: string }>
}

export function Navbar({ title, navigation }: NavbarProps) {
  const [show, setShow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme } = useTheme()
  const isLightTheme = theme === 'light'

  return (
    <Box
      as="header"
      position="sticky"
      left="0"
      right="0"
      ref={containerRef}
    >
      <HStack
        align="center"
        justify="between"
        maxWidth="var(--content-max-width, 72rem)"
        marginHorizontal="auto"
        padding={8}
        elevation="3"
        borderRadius="16"
        backgroundColor="bg-white-low"
      >
        <Button
          leftContent={MenuIcon}
          colorVariant="monochrome-dark"
          styleVariant="tertiary"
          onClick={() => setShow(!show)}
        />
        <Text
          typo="16"
          bold
        >
          {title}
        </Text>
        <Button
          leftContent={isLightTheme ? MoonIcon : WeatherSunIcon}
          onClick={() => setTheme(isLightTheme ? 'dark' : 'light')}
          colorVariant="monochrome-dark"
          styleVariant="tertiary"
        />
      </HStack>

      <Overlay
        show={show}
        withTransition
        target={containerRef.current}
        position="bottom-center"
        marginY={16}
        enableClickOutside
        onClick={() => setShow(false)}
        container={containerRef.current}
        style={{ width: '100%' }}
      >
        <VStack
          justify="between"
          backgroundColor="bg-white-low"
          maxWidth="var(--content-max-width, 72rem)"
          marginHorizontal="auto"
          padding={8}
          elevation="3"
          borderRadius="16"
          spacing={4}
        >
          {navigation.map((nav) => (
            <Link
              key={nav.url}
              href={nav.url}
            >
              <ListItem
                content={nav.url}
                rightContent={
                  <Text
                    typo="12"
                    color="txt-black-dark"
                  >
                    {nav.label}
                  </Text>
                }
              />
            </Link>
          ))}
        </VStack>
      </Overlay>
    </Box>
  )
}
