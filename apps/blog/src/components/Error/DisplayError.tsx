import {
  Button,
  ButtonGroup,
  Center,
  Text,
  VStack,
} from '@channel.io/bezier-react'
import { isEmpty } from 'lodash-es'
import Link from 'next/link'

type DisplayErrorProps = {
  title?: string
  error: Error | null
  reset?: () => void
}

export default function DisplayError({
  title = '서비스에 오류가 발생했습니다.',
  error,
  reset,
}: DisplayErrorProps) {
  return (
    <Center
      width="100vw"
      height="100vh"
    >
      <VStack
        align="center"
        spacing={24}
      >
        <VStack
          align="center"
          spacing={4}
        >
          <Text
            typo="24"
            bold
          >
            {title}
          </Text>

          {!isEmpty(error) && (
            <Text
              typo="18"
              color="txt-black-darker"
            >
              [{error.name}] {error.message}
            </Text>
          )}
        </VStack>

        <ButtonGroup>
          {!isEmpty(reset) && (
            <Button
              onClick={reset}
              text="새로고침"
              styleVariant="secondary"
            />
          )}

          <Link href="/">
            <Button
              text="처음으로"
              colorVariant="monochrome-dark"
              styleVariant="secondary"
            />
          </Link>
        </ButtonGroup>
      </VStack>
    </Center>
  )
}
