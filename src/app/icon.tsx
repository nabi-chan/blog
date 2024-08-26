import { ImageResponse } from "next/og"

export const contentType = "image/png"
export const size = {
  width: 32,
  height: 32,
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
