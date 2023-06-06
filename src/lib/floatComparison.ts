export function areFloatsEqual(
  a: number,
  b: number,
  epsilon: number = 0.00001
): boolean {
  return Math.abs(a - b) < epsilon;
}