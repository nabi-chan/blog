---
title: "How this blog is built"
description: "Notes on building this blog with TanStack Start and Cloudflare Workers."
sourceHash: "6f51268fd4c4f9599b7525a76f3ee1d46dffb62454fceec5782947083bde90c8"
translationStatus: machine
---

kitchen-sink-en

The body will be rewritten in plan 4.

## Structure

![Diagram of this blog](./diagram.svg "Markdown is turned into HTML at build time and served from Workers")

> [!TIP]
> New here? Start with [the structure](/posts/how-this-blog-is-built#structure).

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
