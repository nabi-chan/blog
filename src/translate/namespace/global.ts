import { createLS } from "@/translate/createLS"

export const globalLS = createLS({
  "global.title": {
    ko: "고양이집",
  },
  "global.description": {
    ko: "나비의 개인 블로그 ^_^v",
  },
  "error.title": {
    ko: "500 ERROR",
  },
  "error.description": {
    ko: "무언가 잘못되었습니다.\n[{errorName}] {errorMessage}",
  },
  "error.retry": {
    ko: "다시 시도하기",
  },
  "not-found.title": {
    ko: "404 ERROR",
  },
  "not-found.description": {
    ko: "이 세상에 존재하지 않는 주소를 입력하셨거나,\n요청하신 페이지의 주소가 변경, 삭제되어 찾을 수 없습니다.",
  },
  "not-found.goto.index": {
    ko: "메인으로",
  },
  "nav.links.posts": {
    ko: "글",
  },
  "nav.links.notes": {
    ko: "토막글",
  },
  "nav.links.tags": {
    ko: "태그",
  },
})
