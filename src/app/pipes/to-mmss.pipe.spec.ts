import { ToMMSSPipe } from './to-mmss.pipe';

describe('ToMMSSPipe', () => {
  let pipe: ToMMSSPipe;

  beforeEach(() => {
    pipe = new ToMMSSPipe();
  });

  it('should transform 0 to 00:00', () => {
    expect(pipe.transform('0')).toBe('00:00');
  });

  it('should transform 59 to 00:59', () => {
    expect(pipe.transform('59')).toBe('00:59');
  });

  it('should transform 60 to 01:00', () => {
    expect(pipe.transform('60')).toBe('01:00');
  });

  it('should transform 61 to 01:01', () => {
    expect(pipe.transform('61')).toBe('01:01');
  });

  it('should transform 119 to 01:59', () => {
    expect(pipe.transform('119')).toBe('01:59');
  });

  it('should transform 120 to 02:00', () => {
    expect(pipe.transform('120')).toBe('02:00');
  });

  it('should transform 121 to 02:01', () => {
    expect(pipe.transform('121')).toBe('02:01');
  });
});
