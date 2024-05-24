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
import { useTheme } from '@/provider/ThemeProvider/useTheme'

export function Navbar() {
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
        maxWidth="72rem"
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
          고양이집
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
          maxWidth="72rem"
          marginHorizontal="auto"
          padding={8}
          elevation="3"
          borderRadius="16"
          spacing={4}
        >
          <Link href="/">
            <ListItem
              content="/"
              rightContent={
                <Text
                  typo="12"
                  color="txt-black-dark"
                >
                  집으로 돌아갑니다.
                </Text>
              }
            />
          </Link>

          <Link href="/blog">
            <ListItem
              content="/blog"
              rightContent={
                <Text
                  typo="12"
                  color="txt-black-dark"
                >
                  블로그로 이동합니다.
                </Text>
              }
            />
          </Link>

          <Link href="/resume">
            <ListItem
              content="/resume"
              rightContent={
                <Text
                  typo="12"
                  color="txt-black-dark"
                >
                  이력서를 확인합니다.
                </Text>
              }
            />
          </Link>

          <Link href="/random">
            <ListItem
              content="/random"
              rightContent={
                <Text
                  typo="12"
                  color="txt-black-dark"
                >
                  아무 페이지로 이동합니다.
                </Text>
              }
            />
          </Link>
        </VStack>
      </Overlay>
    </Box>
  )
}
