const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.join(__dirname, '../assets/images');

// قائمة الملفات الكبيرة التي تحتاج تحسين
const largeFiles = [
  'logo.gif',
  'person.gif', 
  'Online-shopping.gif',
  'nubianLogo.png',
  'nubian.png',
  'splash.png'
];

console.log('🔧 بدء تحسين الصور...');

largeFiles.forEach(file => {
  const filePath = path.join(assetsDir, file);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📁 معالجة: ${file} (${sizeInMB}MB)`);
    
    // تحويل GIF إلى WebP أو PNG محسن
    if (file.endsWith('.gif')) {
      const outputFile = file.replace('.gif', '.webp');
      const outputPath = path.join(assetsDir, outputFile);
      
      try {
        // استخدام ImageMagick لتحويل GIF إلى WebP
        execSync(`magick "${filePath}" -quality 80 "${outputPath}"`);
        console.log(`✅ تم تحويل ${file} إلى ${outputFile}`);
        
        // حذف الملف الأصلي إذا كان التحويل ناجح
        const newStats = fs.statSync(outputPath);
        const newSizeInMB = (newStats.size / (1024 * 1024)).toFixed(2);
        
        if (newStats.size < stats.size) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ تم حذف ${file} (توفير ${(sizeInMB - newSizeInMB).toFixed(2)}MB)`);
        }
      } catch (error) {
        console.log(`❌ فشل في تحويل ${file}: ${error.message}`);
      }
    }
    
    // تحسين ملفات PNG
    if (file.endsWith('.png')) {
      try {
        // استخدام pngquant لضغط PNG
        execSync(`pngquant --force --ext .png --quality=65-80 "${filePath}"`);
        console.log(`✅ تم تحسين ${file}`);
      } catch (error) {
        console.log(`❌ فشل في تحسين ${file}: ${error.message}`);
      }
    }
  }
});

console.log('🎉 انتهى تحسين الصور!'); 