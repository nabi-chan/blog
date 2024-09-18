import { ImageResponse } from "next/og"

export const contentType = "image/png"
export const size = {
  width: 384,
  height: 384,
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 384,
        }}>
        🐈
      </div>
    ),
    {
      ...size,
      emoji: "fluent",
    },
  )
}
