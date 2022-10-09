import { isCompilationSuccessful } from '.';

describe('isCompilationSuccessful()', () => {
  test('string: not successful', () => {
    expect(
      isCompilationSuccessful(
        'base64,IntcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInN0ZG91dFwifSI='
      )
    ).toBeFalsy();
  });
  test('string: successful', () => {
    expect(
      isCompilationSuccessful(
        'Successfully compiled: 6 files with swc (72.49ms)'
      )
    ).toBeTruthy();
  });
  test('string array: not successful', () => {
    expect(
      isCompilationSuccessful([
        'base64,IntcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInN0ZG91dFwifSI='
      ])
    ).toBeFalsy();
  });
  test('string array: successful', () => {
    expect(
      isCompilationSuccessful([
        'Successfully compiled: 6 files with swc (72.49ms)'
      ])
    ).toBeTruthy();
  });
});
