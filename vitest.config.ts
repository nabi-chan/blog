import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/content/**/*.{ts,tsx}',
        'src/markdown/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/widgets/**/*.{ts,tsx}',
        'src/api/**/*.ts',
        'src/seo/**/*.ts',
        'src/og/**/*.ts',
        'src/shared/**/*.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/markdown/test-utils.ts',
        'src/content/posts.server.ts',
        'src/content/posts.functions.ts',
        'src/widgets/*.tsx',
        // 테스트 도우미, env 배선, 타입만 있는 파일
        'src/api/test-utils.ts',
        'src/api/context.ts',
        'src/api/types.ts',
        // 지금도 커버리지 밖이던 Paraglide 연결과 사이트 설정
        'src/shared/i18n/messages.ts',
        'src/shared/i18n/runtime.ts',
        'src/shared/config/site.ts',
      ],
      thresholds: { functions: 100, lines: 90 },
    },
  },
})
