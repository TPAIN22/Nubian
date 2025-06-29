import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface BackupData {
  timestamp: number;
  version: string;
  data: Record<string, any>;
  metadata: {
    appVersion: string;
    deviceInfo: string;
    backupSize: number;
  };
}

class BackupManager {
  private static instance: BackupManager;
  private backupInterval: ReturnType<typeof setInterval> | null = null;
  private isEnabled: boolean = true;
  private readonly BACKUP_KEY = 'app_backup_data';
  private readonly BACKUP_VERSION = '1.0.0';

  private constructor() {
    this.setupAutoBackup();
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  // إعداد النسخ الاحتياطي التلقائي
  private setupAutoBackup() {
    if (!this.isEnabled) return;

    // نسخ احتياطي كل 24 ساعة
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, 24 * 60 * 60 * 1000);
  }

  // إنشاء نسخة احتياطية
  async createBackup(): Promise<BackupData | null> {
    try {
      // جمع جميع البيانات من AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const backupData: Record<string, any> = {};

      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            backupData[key] = JSON.parse(value);
          }
        } catch (error) {
          console.warn(`Failed to backup key: ${key}`, error);
        }
      }

      const backup: BackupData = {
        timestamp: Date.now(),
        version: this.BACKUP_VERSION,
        data: backupData,
        metadata: {
          appVersion: '1.0.0', // يمكن تحديثه من app.json
          deviceInfo: 'React Native App',
          backupSize: JSON.stringify(backupData).length,
        },
      };

      // حفظ النسخة الاحتياطية
      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));

      console.log('Backup created successfully');
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  // استعادة النسخة الاحتياطية
  async restoreBackup(backupData: BackupData): Promise<boolean> {
    try {
      // التحقق من إصدار النسخة الاحتياطية
      if (backupData.version !== this.BACKUP_VERSION) {
        console.warn('Backup version mismatch');
      }

      // استعادة البيانات
      for (const [key, value] of Object.entries(backupData.data)) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.warn(`Failed to restore key: ${key}`, error);
        }
      }

      console.log('Backup restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // الحصول على آخر نسخة احتياطية
  async getLatestBackup(): Promise<BackupData | null> {
    try {
      const backupString = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (backupString) {
        return JSON.parse(backupString);
      }
      return null;
    } catch (error) {
      console.error('Failed to get latest backup:', error);
      return null;
    }
  }

  // تصدير النسخة الاحتياطية كملف
  async exportBackup(): Promise<string | null> {
    try {
      const backup = await this.getLatestBackup();
      if (!backup) {
        console.warn('No backup found to export');
        return null;
      }

      const fileName = `nubian_backup_${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

      console.log('Backup exported successfully');
      return filePath;
    } catch (error) {
      console.error('Failed to export backup:', error);
      return null;
    }
  }

  // استيراد نسخة احتياطية من ملف
  async importBackup(filePath: string): Promise<boolean> {
    try {
      const backupString = await FileSystem.readAsStringAsync(filePath);
      const backup: BackupData = JSON.parse(backupString);

      return await this.restoreBackup(backup);
    } catch (error) {
      console.error('Failed to import backup:', error);
      return false;
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  async cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const backup = await this.getLatestBackup();
      if (backup && Date.now() - backup.timestamp > maxAge) {
        await AsyncStorage.removeItem(this.BACKUP_KEY);
        console.log('Old backup cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // تفعيل/إلغاء تفعيل النسخ الاحتياطي التلقائي
  setAutoBackupEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.setupAutoBackup();
      this.createBackup();
    } else if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  // الحصول على معلومات النسخ الاحتياطي
  async getBackupInfo(): Promise<{
    hasBackup: boolean;
    lastBackupTime: number | null;
    backupSize: number | null;
    autoBackupEnabled: boolean;
  }> {
    const backup = await this.getLatestBackup();
    
    return {
      hasBackup: !!backup,
      lastBackupTime: backup?.timestamp || null,
      backupSize: backup?.metadata.backupSize || null,
      autoBackupEnabled: this.isEnabled,
    };
  }

  // إيقاف النسخ الاحتياطي
  destroy() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}

export default BackupManager.getInstance(); 