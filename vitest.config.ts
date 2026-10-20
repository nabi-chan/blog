import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/content/**/*.{ts,tsx}',
        'src/markdown/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/widgets/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.ts',
        'src/markdown/test-utils.ts',
        'src/content/posts.server.ts',
        'src/content/posts.functions.ts',
        'src/widgets/*.tsx',
      ],
      thresholds: { functions: 100, lines: 90 },
    },
  },
})
