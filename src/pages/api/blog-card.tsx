import { BlogCard } from '@/themes/features/opengraph/blog-card';
import { OpenGraphStyles } from '@/themes/features/opengraph/styles';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const [pretendardBold, pretendardRegular] = await Promise.all([
    fetch(new URL('./Pretendard-Bold.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('./Pretendard-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  try {
    return new ImageResponse(
      (
        <div
          style={{
            ...OpenGraphStyles.fontWeight.normal,
            ...OpenGraphStyles.fontFamily.sans,
            ...OpenGraphStyles.layout.column,
            ...OpenGraphStyles.layout.full,
          }}
        >
          <img
            src={'https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&width=1200&height=630'}
            alt="background image"
            style={{
              objectFit: 'cover',
              ...OpenGraphStyles.layout.full,
            }}
          />
          <div
            style={{
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: OpenGraphStyles.colors.zinc_950_80,
              color: OpenGraphStyles.colors.zinc_50,
              ...OpenGraphStyles.layout.full,
              ...OpenGraphStyles.layout.column,
            }}
          >
            <h1
              style={{
                fontSize: OpenGraphStyles.fontSize['7xl'],
                ...OpenGraphStyles.fontWeight.bold,
              }}
            >
              나비의 블로그 🐈
            </h1>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        emoji: 'blobmoji',
        fonts: [
          {
            data: pretendardBold,
            name: 'Pretendard',
            weight: 700,
          },
          {
            data: pretendardRegular,
            name: 'Pretendard',
            weight: 400,
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
