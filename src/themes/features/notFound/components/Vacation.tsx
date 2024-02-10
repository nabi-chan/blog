import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { TypeWriteText } from 'Themes/components/TypeWriteText';
import { useState } from 'react';
import { Link } from '@/themes/components/Link';

function Vacation() {
  const [isTextComplete, setIsTextComplete] = useState(false);
  const { back } = useRouter();

  return (
    <>
      <p className="whitespace-pre-wrap">
        <TypeWriteText
          text={'멋진 바다가 보이는 것 같아!\n하지만 내가 찾던 곳은 아니네...'}
          speed={100}
          onComplete={() => setIsTextComplete(true)}
        />
      </p>
      <div
        className="flex gap-2"
        style={{
          pointerEvents: isTextComplete ? 'auto' : 'none',
          transition: 'opacity 0.5s, transform 0.5s',
          opacity: isTextComplete ? 1 : 0,
          transform: `translateY(${isTextComplete ? 0 : 20}px)`,
        }}
      >
        <button className="text-blue-400 underline underline-offset-4" onClick={back}>
          돌아가기
        </button>
        <Link href="/">메인으로</Link>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(Vacation), { ssr: false });
