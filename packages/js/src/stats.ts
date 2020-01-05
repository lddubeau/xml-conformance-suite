export type FrequencyMap<V> = Map<V, number>;

/**
 * Make a frequency map of the values.
 *
 * @param values The values for which to make a map.
 *
 * @returns A map which has for keys the values from ``values``. Each key is
 * associated with the frequency of that key in ``values``.
 */
export function makeFrequencyMap<V>(values: V[]): FrequencyMap<V> {
  const stats: FrequencyMap<V> = new Map();
  for (const version of values) {
    const num = stats.get(version);
    stats.set(version, num === undefined ? 1 : num + 1);
  }

  return stats;
}

/**
 * If X is not an array then its atom is X. If it is an array, then the atom is
 * the type of the elements of the array.
 */
export type Atom<X> = X extends readonly (infer E)[] ? E : X;

/**
 * Increment the frequency of an atom in a frequency map. If the atom has not
 * been seen yet, set its frequency to 1.
 *
 * @param map The map to alter.
 *
 * @param atom The atom encountered.
 */
function addAtom<T>(map: FrequencyMap<T>, atom: T): void {
  map.set(atom, (map.get(atom) ?? 0) + 1);
}

/**
 * This type models an object containing a series of frequency maps. The object
 * is typed so that its keys are from the keys of a type ``T`` and the values
 * recorded in the frequency map that corresponds to key ``x`` are only those
 * values that ``T[x]`` can take.
 */
export type IndexedFrequencyMaps<T, K extends keyof T> =
  { [k in K]: FrequencyMap<Atom<T[k]>> };

/**
 * Add an observation to frequency maps.
 *
 * @param maps The maps to alter.
 *
 * @param observation The observation to process.
 *
 * @param names The names of the properties on ``observation`` that must be
 * recorded in ``maps``. ``maps`` and ``observation`` must have properties with
 * names that correspond to the values in ``names``.
 */
export function addToFrequencyMaps<T, K extends keyof T>(
  maps: IndexedFrequencyMaps<T, K>,
  observation: T,
  names: readonly K[]): void {
  for (const name of names) {
    const map = maps[name];
    const value = observation[name];
    if (Array.isArray(value)) {
      for (const atom of value) {
        addAtom(map, atom);
      }
    }
    else {
      addAtom(map, value as Atom<T[K]>);
    }
  }
}
