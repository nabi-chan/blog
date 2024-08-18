import { Box } from '@channel.io/bezier-react'
import styled from 'styled-components'

export const Content = styled(Box).attrs({
  as: 'article',
})`
  html[data-bezier-theme='dark'] & {
    color-scheme: dark;
    --color-fg-default: #e6edf3;
    --color-fg-subtle: #6e7681;
    --color-canvas-default: #0d1117;
    --color-canvas-subtle: #161b22;
    --color-border-default: #30363d;
    --color-neutral-muted: rgba(110, 118, 129, 0.4);
    --color-accent-fg: #2f81f7;
    --color-accent-emphasis: #1f6feb;
    --color-success-fg: #3fb950;
    --color-success-emphasis: #238636;
    --color-attention-fg: #d29922;
    --color-attention-emphasis: #9e6a03;
    --color-attention-subtle: rgba(187, 128, 9, 0.15);
    --color-danger-fg: #f85149;
    --color-danger-emphasis: #da3633;
    --color-done-fg: #a371f7;
    --color-done-emphasis: #8957e5;
  }

  html[data-bezier-theme='light'] & {
    color-scheme: light;
    --color-fg-default: #1f2328;
    --color-fg-subtle: #6e7781;
    --color-canvas-default: #ffffff;
    --color-canvas-subtle: #f6f8fa;
    --color-border-default: #d0d7de;
    --color-neutral-muted: rgba(175, 184, 193, 0.2);
    --color-accent-fg: #0969da;
    --color-accent-emphasis: #0969da;
    --color-success-fg: #1a7f37;
    --color-success-emphasis: #1f883d;
    --color-attention-fg: #9a6700;
    --color-attention-emphasis: #9a6700;
    --color-attention-subtle: #fff8c5;
    --color-danger-fg: #d1242f;
    --color-danger-emphasis: #cf222e;
    --color-done-fg: #8250df;
    --color-done-emphasis: #8250df;
  }

  display: flex;
  flex-direction: column;
  gap: 1em;

  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;

  [hidden] {
    display: none !important;
  }

  a {
    background-color: transparent;
    color: var(--color-accent-fg);
    text-decoration: none;
  }

  b,
  strong {
    font-weight: var(--base-text-weight-semibold, 600);
  }

  h1 {
    font-weight: var(--base-text-weight-semibold, 600);
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid var(--bdr-black-dark);
  }

  mark {
    background-color: var(--color-attention-subtle);
    color: var(--color-fg-default);
  }

  small {
    font-size: 90%;
  }

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  img {
    border-style: none;
    max-width: 100%;
    box-sizing: content-box;
    background-color: var(--color-canvas-default);
  }

  code,
  kbd,
  pre,
  samp {
    font-family: monospace;
    font-size: 1em;
  }

  hr {
    box-sizing: content-box;
    overflow: hidden;
    background: transparent;
    border-bottom: 1px solid var(--bdr-black-dark);
    height: 0.25em;
    padding: 0;
    background-color: var(--color-border-default);
    border: 0;
  }

  a:hover {
    text-decoration: underline;
  }

  hr::before {
    display: table;
    content: '';
  }

  hr::after {
    display: table;
    clear: both;
    content: '';
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
  }

  td,
  th {
    padding: 0;
  }

  details summary {
    cursor: pointer;
  }

  details:not([open]) > *:not(summary) {
    display: none !important;
  }

  a:focus {
    outline: 2px solid var(--color-accent-fg);
    outline-offset: -2px;
    box-shadow: none;
  }

  a:focus:not(:focus-visible) {
    outline: solid 1px transparent;
  }

  a:focus-visible {
    outline: 2px solid var(--color-accent-fg);
    outline-offset: -2px;
    box-shadow: none;
  }

  a:not([class]):focus,
  a:not([class]):focus-visible {
    outline-offset: 0;
  }

  kbd {
    display: inline-block;
    padding: 3px 5px;
    font:
      11px ui-monospace,
      SFMono-Regular,
      SF Mono,
      Menlo,
      Consolas,
      Liberation Mono,
      monospace;
    line-height: 10px;
    color: var(--color-fg-default);
    vertical-align: middle;
    background-color: var(--color-canvas-subtle);
    border: solid 1px var(--color-neutral-muted);
    border-bottom-color: var(--color-neutral-muted);
    border-radius: 6px;
    box-shadow: inset 0 -1px 0 var(--color-neutral-muted);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    font-weight: var(--base-text-weight-semibold, 600);
    line-height: 1.25;
  }

  h2 {
    font-weight: var(--base-text-weight-semibold, 600);
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid var(--bdr-black-dark);
  }

  h3 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 1.25em;
  }

  h4 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 1em;
  }

  h5 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 0.875em;
  }

  h6 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 0.85em;
    color: var(--txt-black-darker);
  }

  p {
    margin: 0;
  }

  blockquote {
    margin: 0;
    padding: 0 1em;
    color: var(--txt-black-darker);
    border-left: 0.25em solid var(--color-border-default);
  }

  ul,
  ol {
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 2em;
  }

  ol ol,
  ul ol {
    list-style-type: lower-roman;
  }

  ul ul ol,
  ul ol ol,
  ol ul ol,
  ol ol ol {
    list-style-type: lower-alpha;
  }

  dd {
    margin-left: 0;
  }

  tt,
  code,
  samp {
    font-family:
      ui-monospace,
      SFMono-Regular,
      SF Mono,
      Menlo,
      Consolas,
      Liberation Mono,
      monospace;
    font-size: 12px;
  }

  pre {
    margin-top: 0;
    margin-bottom: 0;
    font-family:
      ui-monospace,
      SFMono-Regular,
      SF Mono,
      Menlo,
      Consolas,
      Liberation Mono,
      monospace;
    font-size: 12px;
    word-wrap: normal;
  }

  > *:first-child {
    margin-top: 0 !important;
  }

  > *:last-child {
    margin-bottom: 0 !important;
  }

  a:not([href]) {
    color: inherit;
    text-decoration: none;
  }

  h1 tt,
  h1 code,
  h2 tt,
  h2 code,
  h3 tt,
  h3 code,
  h4 tt,
  h4 code,
  h5 tt,
  h5 code,
  h6 tt,
  h6 code {
    padding: 0 0.2em;
    font-size: inherit;
  }

  summary h1,
  summary h2,
  summary h3,
  summary h4,
  summary h5,
  summary h6 {
    display: inline-block;
  }

  summary h1 .anchor,
  summary h2 .anchor,
  summary h3 .anchor,
  summary h4 .anchor,
  summary h5 .anchor,
  summary h6 .anchor {
    margin-left: -40px;
  }

  summary h1,
  summary h2 {
    padding-bottom: 0;
    border-bottom: 0;
  }

  ul.no-list,
  ol.no-list {
    padding: 0;
    list-style-type: none;
  }

  ol[type='a s'] {
    list-style-type: lower-alpha;
  }

  ol[type='A s'] {
    list-style-type: upper-alpha;
  }

  ol[type='i s'] {
    list-style-type: lower-roman;
  }

  ol[type='I s'] {
    list-style-type: upper-roman;
  }

  ol[type='1'] {
    list-style-type: decimal;
  }

  div > ol:not([type]) {
    list-style-type: decimal;
  }

  ul ul,
  ul ol,
  ol ol,
  ol ul {
    margin-top: 0;
    margin-bottom: 0;
  }

  li {
    margin-top: 0.35em;
  }

  dl {
    padding: 0;
  }

  dl dt {
    padding: 0;
    margin-top: 16px;
    font-size: 1em;
    font-style: italic;
    font-weight: var(--base-text-weight-semibold, 600);
  }

  dl dd {
    padding: 0 16px;
    margin-bottom: 16px;
  }

  table th {
    font-weight: var(--base-text-weight-semibold, 600);
  }

  table th,
  table td {
    padding: 6px 13px;
    border: 1px solid var(--color-border-default);
  }

  table td > :last-child {
    margin-bottom: 0;
  }

  table tr {
    background-color: var(--color-canvas-default);
    border-top: 1px solid var(--bdr-black-dark);
  }

  table tr:nth-child(2n) {
    background-color: var(--color-canvas-subtle);
  }

  table img {
    background-color: transparent;
  }

  img[align='right'] {
    padding-left: 20px;
  }

  img[align='left'] {
    padding-right: 20px;
  }

  code,
  tt {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    white-space: break-spaces;
    background-color: var(--color-neutral-muted);
    border-radius: 6px;
  }

  code br,
  tt br {
    display: none;
  }

  del code {
    text-decoration: inherit;
  }

  samp {
    font-size: 85%;
  }

  pre code {
    font-size: 100%;
  }

  pre > code {
    padding: 0;
    margin: 0;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0;
  }

  figcaption {
    text-align: center;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 600;
    font-size: 1.3rem;
  }

  figcaption strong {
    color: rgba(0, 0, 0, 0.8);
  }

  .kg-embed-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 0;
    gap: 8px;
  }

  .kg-embed-card
    > :where(iframe[src*='youtube.com'], iframe[src*='vimeo.com']) {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .kg-image-card img {
    margin: auto;
  }

  .kg-card-hascaption {
    display: grid;
    grid-template-columns: inherit;
  }

  .kg-card-hascaption img {
    grid-column: wide-start / wide-end;
  }

  .kg-file-card,
  .kg-file-card * {
    box-sizing: border-box;
  }

  .kg-file-card {
    display: flex;
  }

  .kg-file-card a.kg-file-card-container {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    color: inherit;
    padding: 12px;
    min-height: 92px;
    border: 1px solid rgb(124 139 154/25%);
    border-radius: 5px;
    transition: all ease-in-out 0.35s;
    text-decoration: none;
    width: 100%;
  }

  .kg-file-card a.kg-file-card-container:hover {
    border: 1px solid rgb(124 139 154/35%);
  }

  .kg-file-card-contents {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: 4px 8px;
    width: 100%;
  }

  .kg-file-card-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3em;
  }

  .kg-file-card-caption {
    font-size: 14px;
    line-height: 1.3em;
    opacity: 0.7;
  }

  .kg-file-card-title + .kg-file-card-caption {
    flex-grow: 1;
    margin-top: 3px;
  }

  .kg-file-card-metadata {
    display: inline;
    font-size: 14px;
    line-height: 1.3em;
    margin-top: 5px;
  }

  .kg-file-card-filename {
    display: inline;
    font-weight: 500;
  }

  .kg-file-card-filesize {
    display: inline-block;
    font-size: 14px;
    opacity: 0.6;
  }

  .kg-file-card-filesize:before {
    display: inline-block;
    content: '•';
    margin-left: 6px;
    margin-right: 6px;
  }

  .kg-file-card-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    min-width: 80px;
    height: 100%;
    min-height: 80px;
  }

  .kg-file-card-icon:before {
    position: absolute;
    display: block;
    content: '';
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: currentColor;
    opacity: 0.06;
    transition: opacity ease-in-out 0.35s;
    border-radius: 3px;
  }

  .kg-file-card a.kg-file-card-container:hover .kg-file-card-icon:before {
    opacity: 0.08;
  }

  .kg-file-card-icon svg {
    width: 24px;
    height: 24px;
    color: var(--ghost-accent-color);
  }

  .kg-file-card-medium a.kg-file-card-container {
    min-height: 72px;
  }

  .kg-file-card-medium .kg-file-card-caption {
    opacity: 1;
    font-weight: 500;
  }

  .kg-file-card-small a.kg-file-card-container {
    align-items: center;
    min-height: 52px;
  }

  .kg-file-card-small .kg-file-card-metadata {
    font-size: 14px;
    margin-top: 0;
  }

  .kg-file-card-small .kg-file-card-icon svg {
    width: 20px;
    height: 20px;
  }
`
