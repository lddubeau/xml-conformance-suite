/**
 * Make a frequency map of the values.
 *
 * @param values The values for which to make a map.
 *
 * @returns A map which has for keys the values from ``values``. Each key is
 * associated with the frequency of that key in ``values``.
 */
export function makeFrequencyMap<V>(values: V[]): Map<V, number> {
  const stats: Map<V, number> = new Map();
  for (const version of values) {
    const num = stats.get(version);
    stats.set(version, num === undefined ? 1 : num + 1);
  }

  return stats;
}
