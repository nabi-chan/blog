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
      label="NOTE"
      title="토막글"
      description="사라지기 전에 붙잡아 둔 작은 문장들입니다."
    />,
    {
      ...size,
      fonts: [{ name: "IsYun", data: font, style: "normal" }],
    },
  );
}
