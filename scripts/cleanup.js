const fs = require('fs');
const path = require('path');

// قائمة الملفات والمجلدات التي يمكن حذفها
const cleanupPaths = [
  'node_modules/.cache',
  '.expo',
  'dist',
  'build',
  '*.log',
  '*.tmp'
];

console.log('🧹 بدء تنظيف الملفات غير المستخدمة...');

// حذف مجلد .expo إذا كان موجود
const expoDir = path.join(__dirname, '../.expo');
if (fs.existsSync(expoDir)) {
  fs.rmSync(expoDir, { recursive: true, force: true });
  console.log('✅ تم حذف مجلد .expo');
}

// حذف ملفات log
const logFiles = fs.readdirSync(__dirname + '/..').filter(file => 
  file.endsWith('.log') || file.endsWith('.tmp')
);

logFiles.forEach(file => {
  fs.unlinkSync(path.join(__dirname, '..', file));
  console.log(`🗑️ تم حذف ${file}`);
});

console.log('🎉 انتهى التنظيف!'); 