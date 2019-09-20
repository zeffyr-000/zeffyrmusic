import { PlayerRunning } from './player-running.model';

describe('PlayerRunning', () => {
  it('should create an instance', () => {
    expect(new PlayerRunning('0:00', '5:00', 400, 200)).toBeTruthy();
  });
});
