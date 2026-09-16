import { ImageResponse } from "next/og";

// Default share card for marketing pages: monochrome, typographic, with a
// perforated stamp edge as the one piece of brand furniture.

export const alt = "Barista Gigs — coffee shifts, covered";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f6f6f7",
          padding: 44,
        }}
      >
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            border: "3px solid #0b0b0c",
            borderRadius: 24,
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 26,
              letterSpacing: 8,
              color: "#6b6b70",
            }}
          >
            <span>BARISTAGIGS.COM</span>
            <span>PARIS</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 104,
                fontWeight: 800,
                color: "#0b0b0c",
                letterSpacing: -3,
                lineHeight: 1.02,
              }}
            >
              Coffee shifts,
            </span>
            <span
              style={{
                fontSize: 104,
                fontWeight: 800,
                color: "#0b0b0c",
                letterSpacing: -3,
                lineHeight: 1.02,
              }}
            >
              covered.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 40,
            }}
          >
            <span style={{ fontSize: 30, color: "#6b6b70" }}>
              Cafés post shifts · trusted baristas cover them
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: "#0b0b0c",
                padding: "12px 26px",
                borderRadius: 999,
              }}
            >
              Barista Gigs
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
