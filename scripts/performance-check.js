#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 فحص أداء التطبيق...\n');

// فحص حجم الملفات
function checkFileSizes() {
  console.log('📁 فحص أحجام الملفات:');
  
  const appDir = path.join(__dirname, '../app');
  const componentsDir = path.join(__dirname, '../app/components');
  
  let totalSize = 0;
  let fileCount = 0;
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
        const size = stat.size;
        totalSize += size;
        fileCount++;
        
        if (size > 50000) { // ملفات أكبر من 50KB
          console.log(`  ⚠️  ${filePath.replace(__dirname, '')}: ${(size / 1024).toFixed(2)}KB`);
        }
      }
    });
  }
  
  scanDirectory(appDir);
  
  console.log(`  📊 إجمالي الملفات: ${fileCount}`);
  console.log(`  📊 الحجم الإجمالي: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log('');
}

// فحص التبعيات
function checkDependencies() {
  console.log('📦 فحص التبعيات:');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`  📊 تبعيات الإنتاج: ${dependencies.length}`);
  console.log(`  📊 تبعيات التطوير: ${devDependencies.length}`);
  
  // فحص التبعيات الكبيرة
  const largeDeps = [
    'react-native-reanimated',
    'react-native-gesture-handler',
    '@gorhom/bottom-sheet',
    'moti'
  ];
  
  largeDeps.forEach(dep => {
    if (dependencies.includes(dep)) {
      console.log(`  ⚠️  تبعية كبيرة: ${dep}`);
    }
  });
  
  console.log('');
}

// فحص إعدادات Metro
function checkMetroConfig() {
  console.log('⚙️  فحص إعدادات Metro:');
  
  const metroConfigPath = path.join(__dirname, '../metro.config.js');
  
  if (fs.existsSync(metroConfigPath)) {
    const config = fs.readFileSync(metroConfigPath, 'utf8');
    
    if (config.includes('inlineRequires: true')) {
      console.log('  ✅ inlineRequires مفعل');
    } else {
      console.log('  ⚠️  inlineRequires غير مفعل');
    }
    
    if (config.includes('drop_console')) {
      console.log('  ✅ إزالة console.log مفعلة');
    } else {
      console.log('  ⚠️  إزالة console.log غير مفعلة');
    }
  } else {
    console.log('  ❌ ملف metro.config.js غير موجود');
  }
  
  console.log('');
}

// فحص TypeScript
function checkTypeScript() {
  console.log('🔧 فحص إعدادات TypeScript:');
  
  const tsConfigPath = path.join(__dirname, '../tsconfig.json');
  
  if (fs.existsSync(tsConfigPath)) {
    const config = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    if (config.compilerOptions?.strict) {
      console.log('  ✅ الوضع الصارم مفعل');
    } else {
      console.log('  ⚠️  الوضع الصارم غير مفعل');
    }
    
    if (config.compilerOptions?.noUnusedLocals) {
      console.log('  ✅ فحص المتغيرات غير المستخدمة مفعل');
    } else {
      console.log('  ⚠️  فحص المتغيرات غير المستخدمة غير مفعل');
    }
  } else {
    console.log('  ❌ ملف tsconfig.json غير موجود');
  }
  
  console.log('');
}

// فحص الصور
function checkImages() {
  console.log('🖼️  فحص الصور:');
  
  const assetsDir = path.join(__dirname, '../assets/images');
  
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const imageFiles = files.filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif')
    );
    
    let totalImageSize = 0;
    
    imageFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      const stat = fs.statSync(filePath);
      totalImageSize += stat.size;
      
      if (stat.size > 1024 * 1024) { // أكبر من 1MB
        console.log(`  ⚠️  صورة كبيرة: ${file} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
      }
    });
    
    console.log(`  📊 عدد الصور: ${imageFiles.length}`);
    console.log(`  📊 الحجم الإجمالي: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB`);
  } else {
    console.log('  ❌ مجلد الصور غير موجود');
  }
  
  console.log('');
}

// فحص الاختبارات
function checkTests() {
  console.log('🧪 فحص الاختبارات:');
  
  const testDir = path.join(__dirname, '../__tests__');
  
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir, { recursive: true });
    const testFiles = files.filter(file => 
      typeof file === 'string' && (file.endsWith('.test.js') || file.endsWith('.test.ts') || file.endsWith('.spec.js') || file.endsWith('.spec.ts'))
    );
    
    console.log(`  📊 عدد ملفات الاختبار: ${testFiles.length}`);
    
    if (testFiles.length === 0) {
      console.log('  ⚠️  لا توجد اختبارات');
    }
  } else {
    console.log('  ❌ مجلد الاختبارات غير موجود');
  }
  
  console.log('');
}

// تشغيل جميع الفحوصات
function runAllChecks() {
  checkFileSizes();
  checkDependencies();
  checkMetroConfig();
  checkTypeScript();
  checkImages();
  checkTests();
  
  console.log('✅ انتهى فحص الأداء');
}

runAllChecks(); 