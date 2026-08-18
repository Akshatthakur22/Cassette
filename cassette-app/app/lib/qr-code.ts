/**
 * QR Code generation and URL utilities
 * Using qrcode.react library (lightweight, no external API)
 */

export interface QRCodeData {
  url: string;
  tapeId: string;
  publicId: string;
  size?: number;
  errorLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Generate QR code URL for tape sharing
 */
export function generateTapeQRCodeUrl(publicId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "https://cassette-share.vercel.app";
  return `${baseUrl}/t/${publicId}`;
}

/**
 * Generate QR code data object
 */
export function generateQRCodeData(publicId: string, size = 256): QRCodeData {
  return {
    url: generateTapeQRCodeUrl(publicId),
    tapeId: publicId,
    publicId,
    size,
    errorLevel: "H",
  };
}

/**
 * Parse QR code from image
 * Uses free API instead of client-side
 */
export async function parseQRCodeFromImage(
  imageData: ImageData
): Promise<string | null> {
  try {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob();
    
    // Use online QR decoder API
    const formData = new FormData();
    formData.append("file", blob);
    
    const response = await fetch("https://api.qrserver.com/v1/read-qr-code/", {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json() as any;
    return result.result?.[0]?.symbol?.[0]?.data ?? null;
  } catch (error) {
    console.error("Failed to decode QR code:", error);
    return null;
  }
}

/**
 * Extract tape ID from QR code URL
 */
export function extractTapeIdFromQRUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const match = path.match(/\/t\/([a-zA-Z0-9-]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Generate QR code as SVG string
 * Uses free API
 */
export async function generateQRCodeSVG(publicId: string): Promise<string | null> {
  try {
    const url = generateTapeQRCodeUrl(publicId);
    const encoded = encodeURIComponent(url);
    
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?format=svg&size=300&data=${encoded}`
    );
    
    return response.ok ? response.text() : null;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    return null;
  }
}

/**
 * Generate QR code as data URL (PNG)
 */
export async function generateQRCodeDataUrl(publicId: string): Promise<string | null> {
  try {
    const url = generateTapeQRCodeUrl(publicId);
    const encoded = encodeURIComponent(url);
    
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?format=png&size=300&data=${encoded}`
    );
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to generate QR code PNG:", error);
    return null;
  }
}

/**
 * Simple encoded QR URL for dynamic generation
 * Uses Chart.js QuickChart API (free tier)
 */
export function getQuickQRCodeUrl(publicId: string, size = 300): string {
  const url = generateTapeQRCodeUrl(publicId);
  const encoded = encodeURIComponent(url);
  // Using qr-server.com free API
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}
