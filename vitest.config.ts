import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/api/**/*.ts',
        'src/seo/**/*.ts',
        'src/shared/**/*.ts',
        'src/entities/**/*.ts',
        'src/features/**/*.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/entities/post/markdown/test-utils.ts',
        'src/entities/post/api/posts.server.ts',
        'src/entities/post/api/posts.functions.ts',
        // 테스트 도우미, env 배선, 타입만 있는 파일
        'src/shared/api/test-utils.ts',
        'src/api/context.ts',
        'src/shared/api/types.ts',
        'src/shared/api/api-context.ts',
        // 지금도 커버리지 밖이던 Paraglide 연결과 사이트 설정
        'src/shared/i18n/messages.ts',
        'src/shared/i18n/runtime.ts',
        'src/shared/config/site.ts',
      ],
      thresholds: { functions: 100, lines: 90 },
    },
  },
})
