import QRCode from "qrcode";

export function buildBoxQrPayload(boxNumber: number, boxId: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://movepilot.app";
  return `${origin}/inventory?box=${boxNumber}&id=${boxId}`;
}

export async function generateBoxQrDataUrl(
  boxNumber: number,
  boxId: string
): Promise<string> {
  const payload = buildBoxQrPayload(boxNumber, boxId);
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: 256,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
