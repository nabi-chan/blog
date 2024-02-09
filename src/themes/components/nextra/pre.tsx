import cn from 'clsx';
import type { ComponentProps, ReactElement } from 'react';
import { useCallback, useRef } from 'react';
import { WordWrapIcon } from './icons';
import { Button } from './button';
import { CopyToClipboard } from './copy-to-clipboard';

export const Pre = ({
  children,
  className,
  hasCopyCode,
  filename,
  ...props
}: ComponentProps<'pre'> & {
  filename?: string;
  hasCopyCode?: boolean;
}): ReactElement => {
  const preRef = useRef<HTMLPreElement | null>(null);

  const toggleWordWrap = useCallback(() => {
    const htmlDataset = document.documentElement.dataset;
    const hasWordWrap = 'nextraWordWrap' in htmlDataset;
    if (hasWordWrap) {
      delete htmlDataset.nextraWordWrap;
    } else {
      htmlDataset.nextraWordWrap = '';
    }
  }, []);

  return (
    <div className="nextra-code-block relative">
      {filename && (
        <div className="absolute top-0 z-[1] w-full truncate rounded-t-xl bg-primary-700/5 py-2 px-4 text-xs text-gray-700 dark:bg-primary-300/10 dark:text-gray-200">
          {filename}
        </div>
      )}
      <pre
        className={cn(
          'bg-primary-700/5 overflow-x-auto rounded-xl subpixel-antialiased dark:bg-primary-300/10 text-[.9em]',
          'contrast-more:border contrast-more:border-primary-900/20 contrast-more:contrast-150 contrast-more:dark:border-primary-100/40',
          filename ? 'pt-12 pb-4' : 'py-4',
          className,
        )}
        ref={preRef}
        {...props}
      >
        {children}
      </pre>
      <div
        className={cn(
          'opacity-0 transition [div:hover>&]:opacity-100 focus-within:opacity-100',
          'flex gap-1 absolute m-[11px] right-0',
          filename ? 'top-8' : 'top-0',
        )}
      >
        <Button onClick={toggleWordWrap} className="md:hidden" title="Toggle word wrap">
          <WordWrapIcon className="pointer-events-none h-4 w-4" />
        </Button>
        {hasCopyCode && <CopyToClipboard getValue={() => preRef.current?.querySelector('code')?.textContent || ''} />}
      </div>
    </div>
  );
};
