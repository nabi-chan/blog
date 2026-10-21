// Node(scripts)도 이 파일을 바로 읽으므로 .ts 확장자를 붙인다
// headersFile 은 public/_headers 를 다시 만들 때 쓴다:
// node --input-type=module -e "const m = await import('./src/shared/lib/security-headers/index.ts'); process.stdout.write(m.headersFile())" > public/_headers
export { IMMUTABLE_ASSET_CACHE, SECURITY_HEADERS, headersFile, withSecurityHeaders } from './security-headers.ts'
