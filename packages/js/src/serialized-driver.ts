/**
 * The serialized specification of a test driver.
 */
export interface SerializedDriver {
  /**
   * The driver's name. This typically would be the name of the parser it
   * drives.
   */
  readonly name: string;

  /**
   * This flag indicates whether this XML processor is able to validate
   * documents.
   */
  readonly canValidate: boolean;

  /**
   * This flag indicates whether this XML processor is able to process
   * external entities.
   */
  readonly processesExternalEntities: boolean;
}
