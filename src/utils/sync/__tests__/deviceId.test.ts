import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDeviceId } from '../deviceId';

describe('deviceId', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getDeviceId', () => {
    it('should generate a new device ID if none exists', () => {
      const deviceId = getDeviceId();
      
      expect(deviceId).toBeTruthy();
      expect(deviceId).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-zA-Z0-9]+$/);
      expect(localStorage.getItem('nekogata-device-id')).toBe(deviceId);
    });

    it('should return the same device ID on subsequent calls', () => {
      const firstId = getDeviceId();
      const secondId = getDeviceId();
      
      expect(firstId).toBe(secondId);
    });

    it('should use existing device ID from localStorage', () => {
      const existingId = 'existing-device-id';
      localStorage.setItem('nekogata-device-id', existingId);
      
      const deviceId = getDeviceId();
      
      expect(deviceId).toBe(existingId);
    });

    it('should generate unique IDs for different calls after clearing storage', () => {
      const firstId = getDeviceId();
      localStorage.clear();
      const secondId = getDeviceId();
      
      expect(firstId).not.toBe(secondId);
    });
  });
});