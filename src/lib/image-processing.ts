import sharp from "sharp";

const THUMBNAIL_WIDTH = 400;
const WEB_SIZE_WIDTH = 2048;

export async function getImageDimensions(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(THUMBNAIL_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function generateWebSize(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(WEB_SIZE_WIDTH, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function applyWatermark(
  imageBuffer: Buffer,
  watermarkText: string
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const fontSize = Math.max(16, Math.floor(width / 30));
  const svgWatermark = Buffer.from(
    `<svg width="${width}" height="${height}">
      <style>
        .watermark { fill: rgba(255,255,255,0.4); font-size: ${fontSize}px; font-family: sans-serif; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="watermark">${watermarkText}</text>
    </svg>`
  );

  return image
    .composite([{ input: svgWatermark, gravity: "center" }])
    .toBuffer();
}
