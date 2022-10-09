export function isCompilationSuccessful(stdout: string[] | string): boolean {
  let _stdout: string[];

  if (!Array.isArray(stdout)) {
    _stdout = [stdout];
  } else {
    _stdout = stdout;
  }

  return _stdout.join('').includes('Successfully compiled');
}
