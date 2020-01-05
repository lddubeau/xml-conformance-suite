/**
 * A resource loader designed to run in Node.
 */
import fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

export class ResourceLoader {
  /**
   * Load a file as a string.
   *
   * @param filePath The file to load.
   *
   * @returns The file contents.
   */
  async loadFile(filePath: string): Promise<string> {
    return (await readFile(filePath)).toString();
  }
}
