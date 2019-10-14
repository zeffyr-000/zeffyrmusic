import { ToMMSSPipe } from './to-mmss.pipe';

describe('ToMMSSPipe', () => {

  let pipe: ToMMSSPipe;

  beforeEach(() => {
    pipe = new ToMMSSPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('#transform', () => {
    expect(pipe.transform(66)).toEqual('01:06');
  })
});
