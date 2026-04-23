export function applyUniqueSelection<T extends string | number>(
  selected: T[],
  value: T,
  checked: boolean,
): T[] {
  if (checked) {
    return selected.includes(value) ? selected : [...selected, value];
  }
  return selected.filter((v) => v !== value);
}
