// scripts/* 전용(Node 가 바로 읽는다). 렌더 파이프라인은 닿지 않게 원문 검사만 낸다
export {
  type ContentPostInput,
  collectContentProblems,
  collectContentWarnings,
  messageKeyDiff,
  plainTextMarker,
} from './source/content-checks.ts'
export { replaceSourceHash, splitFrontmatter } from './source/rehash.ts'
export { computeSourceHash } from './source/source-hash.ts'
export { compareStructure, translationStructure } from './source/translation-structure.ts'
