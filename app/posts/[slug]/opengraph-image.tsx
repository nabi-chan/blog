import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getEntries, getEntry } from "@/src/content/loader";
import { loadIsYunFont } from "@/src/og/font";
import { OgTemplate } from "@/src/og/template";

type Props = { params: Promise<{ slug: string }> };

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const posts = await getEntries("posts");
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getEntry("posts", slug);
  if (!post) notFound();

  const font = await loadIsYunFont();
  return new ImageResponse(
    <OgTemplate
      label="BLOG"
      title={post.title}
      description={post.description}
    />,
    {
      ...size,
      fonts: [{ name: "IsYun", data: font, style: "normal" }],
    },
  );
}
