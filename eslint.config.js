import base from "@cat-hou-se/eslint-config/base"
import react from "@cat-hou-se/eslint-config/react"
import typescript from "@cat-hou-se/eslint-config/typescript"

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  ...react,
  ...typescript,
  {
    files: ["**/*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]
