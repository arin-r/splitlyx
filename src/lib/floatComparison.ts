export function areFloatsEqual(
  a: number,
  b: number,
  epsilon: number = 0.05
): boolean {
  const delta = Math.abs(a - b);
  return Math.abs(a - b) <= epsilon;
}
