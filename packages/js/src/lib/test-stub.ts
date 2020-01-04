import { SerializedTest } from "./serialized-test";
import { TestSpec, TestType } from "./test-spec";

/**
 * A test stub is an object that implements TestSpecification but is not a
 * complete test as if it were built from the actual test suite. Rather, it is
 * built from a serialized representation of a test.
 */
export class TestStub implements TestSpec {
  id!: string;
  testType!: TestType;
  version!: string | undefined;
  recommendation!: string;
  editions!: string[] | undefined;
  sections!: string[];
  productions!: string[];
  entities!: string;
  skipForNonValidatingParser!: boolean;
  forbidsNamespaces!: boolean;

  private hasDTD!: boolean;
  private hasBOM!: boolean;

  constructor(serializedTest: SerializedTest) {
    Object.assign(this, serializedTest);
  }

  async getHasDTD(): Promise<boolean> {
    return this.hasDTD;
  }

  async getHasBOM(): Promise<boolean> {
    return this.hasBOM;
  }

  includesRecommendation(desiredRecommendation: string): boolean {
    return this.recommendation === desiredRecommendation;
  }

  includesVersion(desiredVersion: string): boolean {
    const { version } = this;
    // An undefined VERSION means "all versions".
    return version === undefined || version === desiredVersion;
  }

  includesEdition(desiredEdition: string): boolean {
    const { editions } = this;
    // An undefined EDITION means "all editions".
    return editions === undefined || editions.includes(desiredEdition);
  }

  includesSections(desiredSections: string[]): boolean {
    const { sections } = this;
    return desiredSections.some(section => sections.includes(section));
  }

  includesProductions(desiredProductions: string[]): boolean {
    const { productions } = this;
    return desiredProductions
      .some(production => productions.includes(production));
  }
}
