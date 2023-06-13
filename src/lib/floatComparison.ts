export function areFloatsEqual(
  a: number,
  b: number,
  epsilon: number = 0.05
): boolean {
  const delta = Math.abs(a - b);
  console.log("🚀 ~ file: floatComparison.ts:7 ~ delta:", delta);
  return Math.abs(a - b) <= epsilon;
}
