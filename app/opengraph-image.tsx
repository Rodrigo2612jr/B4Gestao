import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "B4 Gestão Ocupacional — Saúde e Segurança do Trabalho com Inteligência Estratégica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "linear-gradient(135deg, #011e2e 0%, #0A2E4D 50%, #014460 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(0, 151, 167, 0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: "40%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(243, 175, 0, 0.1)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#26A69A",
            }}
          >
            B4
          </span>
          <span
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "white",
            }}
          >
            Gestão Ocupacional
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.15,
            maxWidth: "850px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Rigor técnico, segurança</span>
          <span>
            jurídica e{" "}
            <span style={{ color: "#F3AF00" }}>inteligência</span>
          </span>
          <span style={{ color: "#26A69A" }}>estratégica.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.7)",
            marginTop: "24px",
            maxWidth: "700px",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Consultoria em SST: PGR em 7 dias | Riscos Psicossociais NR-01 | Cobertura Nacional
        </div>

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "40px",
            padding: "12px 24px",
            borderRadius: "999px",
            background: "rgba(243, 175, 0, 0.15)",
            border: "1px solid rgba(243, 175, 0, 0.3)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F3AF00",
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#F3AF00",
            }}
          >
            NR-01 entra em vigor em 26/05/2026
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
