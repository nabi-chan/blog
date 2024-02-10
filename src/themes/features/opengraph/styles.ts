import { CSSProperties } from 'react';

export namespace OpenGraphStyles {
  export const colors = {
    zinc_50: '#fafafa',
    zinc_300: '#d9d9d9',
    zinc_500: '#737373',
    zinc_950: '#09090b',
    zinc_950_80: 'rgba(9, 9, 11, 0.8)',
  };

  export const spacing = {
    0: '0',
    1: '0.5rem',
    2: '1rem',
    3: '1.5rem',
    4: '2rem',
    5: '2.5rem',
  };

  export const fontSize = {
    'sm': '0.875rem',
    'base': '1rem',
    'lg': '1.125rem',
    'xl': '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  };

  export const fontWeight: Record<string, CSSProperties> = {
    normal: {
      fontWeight: 400,
    },
    bold: {
      fontWeight: 700,
    },
  };

  export const fontFamily: Record<string, CSSProperties> = {
    sans: {
      fontFamily: 'Pretendard',
    },
  };

  export const layout: Record<string, CSSProperties> = {
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
    },
    full: {
      width: '100%',
      height: '100%',
    },
  };
}
