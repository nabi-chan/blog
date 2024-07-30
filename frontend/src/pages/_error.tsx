import {
  Center,
  Text,
  Button,
  VStack,
  ButtonGroup,
} from '@channel.io/bezier-react'
import type { NextPageContext } from 'next'
import Link from 'next/link'

const contentMap: Record<number, string> = {
  404: '여기가 어디죠?',
  500: '무엇인가 잘못된 것 같아요...',
}

export default function ErrorPage({
  statusCode,
  error,
}: {
  statusCode: number
  error: Error | null
}) {
  return (
    <Center
      width="100vw"
      height="100vh"
    >
      <VStack
        spacing={24}
        align="center"
      >
        <VStack
          spacing={4}
          align="center"
        >
          <Text
            typo="30"
            bold
          >
            {statusCode}
          </Text>
          <Text typo="16">
            {contentMap[statusCode] ?? '대체 무슨 일이 일어나고 있는거죠?'}
          </Text>
        </VStack>

        <ButtonGroup>
          <Link href="/">
            <Button text="메인 페이지로" />
          </Link>
        </ButtonGroup>
      </VStack>
    </Center>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  return {
    statusCode: res?.statusCode ?? err?.statusCode ?? 500,
    error: err ?? null,
  }
}
