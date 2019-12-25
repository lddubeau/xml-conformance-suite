/**
 * A resource loader designed to run in browsers.
 */
import { join } from "./browser-path";

export class ResourceLoader {
  /**
   * @param base A base directory to add to all paths. This is
   * especially useful for test runners that serve files under a specific
   * prefix. For instance Karma usually serves files under "/base/".
   */
  constructor(private readonly base: string) {
  }

  /**
   * Load a file as a string.
   *
   * @param filePath The file to load.
   *
   * @returns The file contents.
   */
  async loadFile(filePath: string): Promise<string> {
    const fullPath = join(this.base, filePath);
    const response = await fetch(fullPath);
    if (!response.ok) {
      throw new Error(`unable to fetch ${fullPath}`);
    }

    return response.text();
  }
}
