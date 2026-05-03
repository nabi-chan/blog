import { site } from "@/src/site";

export function OgTemplate({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fff8ec",
        color: "#4b3f39",
        fontFamily: "IsYun",
        padding: "68px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 12% 20%, #c9f2df 0 90px, transparent 92px), radial-gradient(circle at 88% 18%, #ded7ff 0 110px, transparent 112px), radial-gradient(circle at 80% 86%, #ffd5c2 0 140px, transparent 142px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 52,
          width: 180,
          height: 42,
          background: "rgba(255, 213, 194, 0.72)",
          transform: "rotate(-7deg)",
          borderRadius: 12,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            borderRadius: 999,
            background: "#fff1a8",
            padding: "10px 24px",
            fontSize: 34,
          }}
        >
          {label}
        </div>
        <div
          style={{
            maxWidth: 880,
            fontSize: 78,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: 850,
            color: "#8c7a70",
            fontSize: 34,
            lineHeight: 1.35,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 30,
        }}
      >
        <span>{site.description}</span>
        <span>nabi.kim</span>
      </div>
    </div>
  );
}
