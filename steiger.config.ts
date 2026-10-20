import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

// FSD 구조 검사 (pnpm lint:fsd, audit:repo). 규칙은 recommended 그대로 쓴다
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Paraglide 생성물과 TanStack 라우트 트리 생성물은 손으로 쓰는 코드가 아니다
    ignores: ['./src/paraglide/**', './src/app/routeTree.gen.ts'],
  },
])
