import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../../utils/logger.js';

describe('Logger', () => {
  let stderrWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  describe('setLevel', () => {
    it('should change log level', () => {
      logger.setLevel('debug');
      logger.setLevel('error');
      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger.setLevel('debug');
    });

    it('should log debug messages', () => {
      logger.debug('debug message', { key: 'value' });
      
      expect(stderrWrite).toHaveBeenCalled();
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('debug message');
      expect(loggedData.data).toEqual({ key: 'value' });
    });

    it('should log info messages', () => {
      logger.info('info message');
      
      expect(stderrWrite).toHaveBeenCalled();
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('info message');
    });

    it('should log warn messages', () => {
      logger.warn('warn message');
      
      expect(stderrWrite).toHaveBeenCalled();
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('warn message');
    });

    it('should log error messages', () => {
      logger.error('error message');
      
      expect(stderrWrite).toHaveBeenCalled();
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('error message');
    });
  });

  describe('log level filtering', () => {
    it('should not log debug when level is info', () => {
      logger.setLevel('info');
      logger.debug('should not appear');
      
      expect(stderrWrite).not.toHaveBeenCalled();
    });

    it('should not log info when level is error', () => {
      logger.setLevel('error');
      logger.info('should not appear');
      
      expect(stderrWrite).not.toHaveBeenCalled();
    });

    it('should log all levels when level is debug', () => {
      logger.setLevel('debug');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(stderrWrite).toHaveBeenCalledTimes(4);
    });

    it('should only log error when level is error', () => {
      logger.setLevel('error');
      
      logger.debug('should not appear');
      logger.info('should not appear');
      logger.warn('should not appear');
      logger.error('should appear');
      
      expect(stderrWrite).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('error');
    });
  });

  describe('timestamp', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      logger.setLevel('info');
    });

    it('should include ISO timestamp in log output', () => {
      logger.info('test message');
      
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.timestamp).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('data handling', () => {
    beforeEach(() => {
      logger.setLevel('debug');
    });

    it('should handle undefined data', () => {
      logger.info('message');
      
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.data).toBeUndefined();
    });

    it('should handle null data', () => {
      logger.info('message', null);
      
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.data).toBeNull();
    });

    it('should handle complex data objects', () => {
      logger.info('message', { nested: { value: 123 }, array: [1, 2, 3] });
      
      const loggedData = JSON.parse(stderrWrite.mock.calls[0][0] as string);
      expect(loggedData.data).toEqual({ nested: { value: 123 }, array: [1, 2, 3] });
    });
  });
});
