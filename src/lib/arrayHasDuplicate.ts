function arrayHasDuplicates<T>(array: T[]): boolean {
  return new Set(array).size !== array.length;
}

export default arrayHasDuplicates;
