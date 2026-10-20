---
title: "How this blog is built"
description: "Notes on building this blog with TanStack Start and Cloudflare Workers."
sourceHash: "f6fe3c7b207f6b297ea71ca835d5bd2e6e4883f045588266a763823d4b45235c"
translationStatus: machine
---

kitchen-sink-en

The body will be rewritten in plan 4.

## Structure

![Diagram of this blog](./diagram.svg "Markdown is turned into HTML at build time and served from Workers")

> [!TIP]
> New here? Start with [the structure](/261020#structure).

### Rendering

```ts
const greeting = 'Hello'
```

![Screen example](./screenshot.png)

An inline ![small example](./screenshot.png?w=120) image works too.

Pages are :term[prerendered]{key="prerender"} ahead of time. Writing key:value in prose stays intact.

:::details
Show build log

A placeholder log.
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
This sentence shows where widgets cannot run.
:::

## Wrapping up

A placeholder paragraph.

:::see-also
- [docs] [TanStack Start](https://tanstack.com/start)
- [repo] [Content Collections](https://github.com/sdorra/content-collections)
:::
