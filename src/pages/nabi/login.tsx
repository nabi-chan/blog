import { KeyIcon } from '@channel.io/bezier-icons'
import { VStack, Button } from '@channel.io/bezier-react'
import { supabase } from '@/supabase/client'

export default function Page() {
  const handleClickLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/nabi`,
      },
    })
  }

  return (
    <VStack
      justify="center"
      align="center"
      height="100vh"
      padding={24}
    >
      <Button
        leftContent={KeyIcon}
        onClick={handleClickLogin}
        colorVariant="monochrome-dark"
        styleVariant="secondary"
        text="Github로 로그인하기"
      />
    </VStack>
  )
}
