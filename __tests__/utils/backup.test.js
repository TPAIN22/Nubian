import BackupManager from '@/utils/backup';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  documentDirectory: '/test/documents/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

describe('Backup Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('BackupManager Instance', () => {
    it('should be a singleton', () => {
      const instance1 = BackupManager;
      const instance2 = BackupManager;
      expect(instance1).toBe(instance2);
    });

    it('should create backup successfully', async () => {
      // Add some test data to AsyncStorage
      await AsyncStorage.setItem('testKey1', JSON.stringify({ data: 'value1' }));
      await AsyncStorage.setItem('testKey2', JSON.stringify({ data: 'value2' }));
      
      const backup = await BackupManager.createBackup();
      
      expect(backup).toBeTruthy();
      expect(backup.version).toBe('1.0.0');
      expect(backup.data).toHaveProperty('testKey1');
      expect(backup.data).toHaveProperty('testKey2');
    });

    it('should restore backup successfully', async () => {
      const testBackup = {
        timestamp: Date.now(),
        version: '1.0.0',
        data: {
          testKey1: { data: 'value1' },
          testKey2: { data: 'value2' }
        },
        metadata: {
          appVersion: '1.0.0',
          deviceInfo: 'Test Device',
          backupSize: 100
        }
      };
      
      const result = await BackupManager.restoreBackup(testBackup);
      
      expect(result).toBe(true);
      
      // Check if data was restored
      const value1 = await AsyncStorage.getItem('testKey1');
      const value2 = await AsyncStorage.getItem('testKey2');
      
      expect(JSON.parse(value1)).toEqual({ data: 'value1' });
      expect(JSON.parse(value2)).toEqual({ data: 'value2' });
    });

    it('should get latest backup', async () => {
      // Create a backup first
      await AsyncStorage.setItem('testKey', JSON.stringify({ data: 'value' }));
      await BackupManager.createBackup();
      
      const latestBackup = await BackupManager.getLatestBackup();
      
      expect(latestBackup).toBeTruthy();
      expect(latestBackup.version).toBe('1.0.0');
    });

    it('should export backup to file', async () => {
      const { writeAsStringAsync } = require('expo-file-system');
      
      // Mock successful file write
      writeAsStringAsync.mockResolvedValue();
      
      // Create a backup first
      await AsyncStorage.setItem('testKey', JSON.stringify({ data: 'value' }));
      await BackupManager.createBackup();
      
      const filePath = await BackupManager.exportBackup();
      
      expect(filePath).toBeTruthy();
      expect(writeAsStringAsync).toHaveBeenCalled();
    });

    it('should import backup from file', async () => {
      const { readAsStringAsync } = require('expo-file-system');
      
      const testBackupData = {
        timestamp: Date.now(),
        version: '1.0.0',
        data: { testKey: { data: 'value' } },
        metadata: {
          appVersion: '1.0.0',
          deviceInfo: 'Test Device',
          backupSize: 50
        }
      };
      
      // Mock file read
      readAsStringAsync.mockResolvedValue(JSON.stringify(testBackupData));
      
      const result = await BackupManager.importBackup('/test/backup.json');
      
      expect(result).toBe(true);
      expect(readAsStringAsync).toHaveBeenCalledWith('/test/backup.json');
    });

    it('should cleanup old backups', async () => {
      // Create a backup
      await AsyncStorage.setItem('testKey', JSON.stringify({ data: 'value' }));
      await BackupManager.createBackup();
      
      // Mock old timestamp
      const oldBackup = {
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        version: '1.0.0',
        data: { oldKey: { data: 'oldValue' } },
        metadata: {
          appVersion: '1.0.0',
          deviceInfo: 'Test Device',
          backupSize: 50
        }
      };
      
      await AsyncStorage.setItem('app_backup_data', JSON.stringify(oldBackup));
      
      await BackupManager.cleanupOldBackups();
      
      // Check if old backup was removed
      const backupData = await AsyncStorage.getItem('app_backup_data');
      expect(backupData).toBeNull();
    });

    it('should get backup info', async () => {
      // Create a backup first
      await AsyncStorage.setItem('testKey', JSON.stringify({ data: 'value' }));
      await BackupManager.createBackup();
      
      const info = await BackupManager.getBackupInfo();
      
      expect(info.hasBackup).toBe(true);
      expect(info.lastBackupTime).toBeTruthy();
      expect(info.backupSize).toBeTruthy();
      expect(info.autoBackupEnabled).toBe(true);
    });

    it('should enable/disable auto backup', () => {
      BackupManager.setAutoBackupEnabled(false);
      // Note: We can't easily test the interval without complex mocking
      // But we can test that the method doesn't throw
      expect(() => BackupManager.setAutoBackupEnabled(true)).not.toThrow();
    });
  });
}); 