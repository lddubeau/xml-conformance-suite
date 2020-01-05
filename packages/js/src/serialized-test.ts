
/**
 * The serialized representation of a test.
 */
export interface SerializedTest {
  id: string;
  testType: string;
  version: string | undefined;
  recommendation: string;
  editions: string[] | undefined;
  sections: string[];
  productions: string[];
  entities: string;
  skipForNonValidatingParser: boolean;
  forbidsNamespaces: boolean;
  hasDTD: boolean;
  hasBOM: boolean;
}
