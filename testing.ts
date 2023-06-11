function getA(n: number) {
  const a: number[] = [];
  for (let i = 0; i < n; ++i) {
    a.push(i);
  }
  return a;
}

const n = 10;
const a = getA(n);
for (let i = 0; i < n; ++i) {
  const element = a[i];
}
