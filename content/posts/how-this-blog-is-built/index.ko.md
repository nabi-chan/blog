---
title: "이 블로그를 어떻게 만들었나"
description: "TanStack Start 와 Cloudflare Workers 로 이 블로그를 만든 과정을 정리합니다."
date: "2026-10-20 12:00"
tags: ["meta"]
---

kitchen-sink-ko

본문은 계획 4 에서 다시 씁니다.

## 구성

![이 블로그의 구성도](./diagram.svg "Markdown 을 빌드할 때 HTML 로 만들어 Workers 에서 서빙합니다")

> [!TIP]
> 처음 오셨다면 [구성](/posts/how-this-blog-is-built#구성) 부터 보세요.

### 렌더링

```ts
const greeting = '안녕하세요'
```

![화면 예시](./screenshot.png)

문장 안 ![작은 예시](./screenshot.png?w=120) 이미지도 됩니다.

글은 미리 :term[프리렌더]{key="prerender"} 해 둡니다. 비율은 key:value 처럼 써도 그대로 남습니다.

:::details
빌드 로그 보기

자리표시 로그입니다.
:::

::::quote
:::translation
단순한 것이 신뢰할 수 있는 것의 전제 조건이다.
:::
:::original
Simplicity is prerequisite for reliability.
:::
::::

:::widget-counter-demo
위젯을 쓸 수 없는 환경에서는 이 문장이 보입니다.
:::

## 마치며

자리표시 문단입니다.

:::see-also
- [docs] [TanStack Start](https://tanstack.com/start)
- [repo] [Content Collections](https://github.com/sdorra/content-collections)
:::
