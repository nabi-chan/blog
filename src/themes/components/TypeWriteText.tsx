import { noop } from 'lodash-es';
import { useState, useEffect, useRef } from 'react';

export function TypeWriteText({ text, speed = 100, onComplete = noop }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);

      return () => clearTimeout(timeoutId);
    } else {
      onComplete();
    }
  }, [index, text, speed]);

  return <span>{displayedText}</span>;
}
