import { PlayerRunning } from './player-running.model';

describe('PlayerRunning', () => {
  const defaultKey = 'test-key';
  const defaultCurrentTimeStr = '01:30';
  const defaultTotalTimeStr = '03:45';
  const defaultSlideLength = 100;
  const defaultLoadVideo = 1;
  const defaultTotalTime = 225; // 3:45 in seconds

  it('should create an instance', () => {
    expect(new PlayerRunning('XXX', '0:00', '5:00', 400, 200, 300)).toBeTruthy();
  });

  describe('equals method', () => {
    it('should return true when comparing an instance with itself', () => {
      // Arrange
      const playerRunning = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning.equals(playerRunning)).toBe(true);
    });

    it('should return true when comparing two identical instances', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(true);
    });

    it('should return false when key is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        'different-key',
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });

    it('should return false when currentTimeStr is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        '02:15',
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });

    it('should return false when totalTimeStr is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        '04:30',
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });

    it('should return false when slideLength is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        200,
        defaultLoadVideo,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });

    it('should return false when loadVideo is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        2,
        defaultTotalTime
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });

    it('should return false when totalTime is different', () => {
      // Arrange
      const playerRunning1 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        defaultTotalTime
      );

      const playerRunning2 = new PlayerRunning(
        defaultKey,
        defaultCurrentTimeStr,
        defaultTotalTimeStr,
        defaultSlideLength,
        defaultLoadVideo,
        300
      );

      // Act & Assert
      expect(playerRunning1.equals(playerRunning2)).toBe(false);
    });
  });
});
