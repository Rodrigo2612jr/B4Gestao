/**
 * Otimiza favicons (icon.png 64x64, apple-icon.png 180x180).
 * Uso: npx tsx scripts/optimize-favicons.ts
 */
import path from "node:path";
import sharp from "sharp";

async function run() {
  const src = path.resolve("public/images/logo-icon.png");
  const iconDst = path.resolve("app/icon.png");
  const appleDst = path.resolve("app/apple-icon.png");

  await sharp(src)
    .resize(64, 64, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(iconDst);

  await sharp(src)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(appleDst);

  console.log("✓ Favicons otimizados");
  console.log(`  icon.png       → 64×64`);
  console.log(`  apple-icon.png → 180×180`);
}

run().catch((err) => { console.error(err); process.exit(1); });
