import { ImageResponse } from "next/og";
import { site } from "@/src/site";
import { loadIsYunFont } from "@/src/og/font";
import { OgTemplate } from "@/src/og/template";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  const font = await loadIsYunFont();
  return new ImageResponse(
    <OgTemplate
      label="NABI BLOG"
      title={site.title}
      description={site.description}
    />,
    {
      ...size,
      fonts: [{ name: "IsYun", data: font, style: "normal" }],
    },
  );
}
