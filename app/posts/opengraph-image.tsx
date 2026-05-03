import { ImageResponse } from "next/og";
import { loadIsYunFont } from "@/src/og/font";
import { OgTemplate } from "@/src/og/template";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  const font = await loadIsYunFont();
  return new ImageResponse(
    <OgTemplate
      label="BLOG"
      title="블로그"
      description="조금 길게 남겨둔 생각과 시행착오입니다."
    />,
    {
      ...size,
      fonts: [{ name: "IsYun", data: font, style: "normal" }],
    },
  );
}
