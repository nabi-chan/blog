import {
  Center,
  Text,
  Button,
  VStack,
  ButtonGroup,
} from '@channel.io/bezier-react'
import Link from 'next/link'
export default function NotFoundPage() {
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
            404
          </Text>
          <Text typo="16">
            여기가 어디죠?
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
