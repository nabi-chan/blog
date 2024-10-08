import * as styled from 'styled-components'

export const GlobalStyle = styled.createGlobalStyle`
  html[data-bezier-theme='dark'] {
    background: rgb(38, 38, 38);
    color-scheme: dark;
  }

  body {
    margin: 0;
    padding: 0;

    font-family: monospace;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`
