const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const assetsDir = path.join(__dirname, "../assets/images");
const outputDir = path.join(assetsDir, "optimized");
const backupDir = path.join(assetsDir, "backup");

// إعدادات الضغط
const MAX_SIZE_MB = 0.3; // أي صورة أكبر من 300KB يتم ضغطها
const WEBP_QUALITY = 70;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getSizeMB(filePath) {
  return fs.statSync(filePath).size / (1024 * 1024);
}

async function optimizeImage(file) {
  const inputPath = path.join(assetsDir, file);
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file, ext);

  const sizeMB = getSizeMB(inputPath);

  if (sizeMB < MAX_SIZE_MB) {
    console.log(`⚪ تخطي: ${file} (${sizeMB.toFixed(2)}MB صغير بالفعل)`);
    return;
  }

  console.log(`🖼️ معالجة: ${file} (${sizeMB.toFixed(2)}MB)`);

  ensureDir(outputDir);
  ensureDir(backupDir);

  const outputPath = path.join(outputDir, `${name}.webp`);
  const backupPath = path.join(backupDir, file);

  // نسخة احتياطية
  fs.copyFileSync(inputPath, backupPath);

  try {
    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    const newSizeMB = getSizeMB(outputPath);

    console.log(
      `✅ تم التحسين: ${file} → ${name}.webp (${newSizeMB.toFixed(2)}MB)`
    );
    console.log(`💾 توفير: ${(sizeMB - newSizeMB).toFixed(2)}MB`);
  } catch (err) {
    console.log(`❌ خطأ في ${file}:`, err.message);
  }
}

async function main() {
  console.log("🔧 بدء تحسين الصور...");

  const files = fs.readdirSync(assetsDir).filter(f =>
    [".png", ".jpg", ".jpeg", ".gif"].includes(path.extname(f).toLowerCase())
  );

  for (const file of files) {
    await optimizeImage(file);
  }

  console.log("🎉 انتهى تحسين الصور!");
}

main();
