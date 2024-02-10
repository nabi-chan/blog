import { OpenGraphStyles } from '@/themes/features/opengraph/styles';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  const [pretendardBold, pretendardRegular] = await Promise.all([
    fetch(new URL('./Pretendard-Bold.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL('./Pretendard-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  const { searchParams } = new URL(request.url);

  const image = searchParams.get('image');

  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const tags = searchParams.getAll('tags');

  if (!title) {
    throw new Error('Title search param is required.');
  } else if (!description) {
    throw new Error('Description search param is required.');
  }

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
            src={image ?? 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&width=1200&height=630'}
            alt="background image"
            style={{
              objectFit: 'cover',
              ...OpenGraphStyles.layout.full,
            }}
          />
          <div
            style={{
              position: 'absolute',
              justifyContent: 'space-between',
              backgroundColor: OpenGraphStyles.colors.zinc_950_80,
              color: OpenGraphStyles.colors.zinc_50,
              padding: OpenGraphStyles.spacing[5],
              ...OpenGraphStyles.layout.full,
              ...OpenGraphStyles.layout.column,
            }}
          >
            <div
              style={{
                justifyContent: 'flex-end',
                ...OpenGraphStyles.layout.row,
              }}
            >
              <span
                style={{
                  fontSize: OpenGraphStyles.fontSize['3xl'],
                  ...OpenGraphStyles.fontWeight.bold,
                }}
              >
                나비의 블로그 🐈
              </span>
            </div>
            <div
              style={{
                ...OpenGraphStyles.layout.column,
              }}
            >
              <h1
                style={{
                  margin: OpenGraphStyles.spacing[0],
                  fontSize: OpenGraphStyles.fontSize['6xl'],
                  ...OpenGraphStyles.fontWeight.bold,
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  margin: OpenGraphStyles.spacing[0],
                  fontSize: OpenGraphStyles.fontSize['3xl'],
                }}
              >
                {description}
              </p>
              {tags.length > 0 && (
                <div
                  style={{
                    flexWrap: 'wrap',
                    overflow: 'hidden',
                    height: '32px',
                    marginTop: OpenGraphStyles.spacing[1],
                    ...OpenGraphStyles.layout.row,
                  }}
                >
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        marginRight: OpenGraphStyles.spacing[1],
                        padding: `0.25rem 0.5rem`,
                        borderRadius: '0.5rem',
                        backgroundColor: OpenGraphStyles.colors.zinc_50,
                        color: OpenGraphStyles.colors.zinc_950,
                        fontSize: OpenGraphStyles.fontSize['xl'],
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
