/**
 * XSD Schema Validation
 *
 * Validates generated CII XML against the official Factur-X / ZUGFeRD XSD
 * schemas using {@link https://github.com/jameslan/libxml2-wasm | libxml2-wasm}
 * (WebAssembly port of libxml2).
 *
 * Schema files are shipped with the package in `schema/` and loaded at
 * validation time.  Because `libxml2-wasm` is ESM-only, this module uses
 * dynamic `import()` so the package stays consumable from both CJS and ESM.
 *
 * @module validation/xsd-validator
 * @license EUPL-1.2
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Profile } from "../flavors/constants";
import { PROFILE_SCHEMA_DIRS, PROFILE_MAIN_XSD } from "../flavors/constants";

/**
 * A single XSD validation error.
 */
export interface XsdValidationError {
  /** Human-readable error message from the XSD validator */
  message: string;
  /** Line number in the XML document, if available */
  line?: number;
  /** Column number in the XML document, if available */
  column?: number;
}

/**
 * Result returned by {@link validateXsd}.
 */
export interface XsdValidationResult {
  /** Whether the XML is valid against the profile XSD */
  valid: boolean;
  /** List of XSD validation errors (empty when valid) */
  errors: XsdValidationError[];
}

/**
 * Options for {@link validateXsd}.
 */
export interface XsdValidateOptions {
  /**
   * Override the base path where the `schema/` folder is located.
   * Defaults to auto-detection from the package installation directory.
   */
  schemaBasePath?: string;
}

/**
 * Finds the `schema/` directory by walking up from a starting directory.
 *
 * @param startDir - Directory to start searching from
 * @returns Absolute path to the `schema/` directory
 * @throws Error if the schema directory cannot be found
 */
function findSchemaDir(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "schema");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "Could not auto-detect the schema directory. " +
      "Pass `schemaBasePath` pointing to the folder that contains `schema/`.",
  );
}

/**
 * Resolves the absolute path to the main XSD file for a profile.
 *
 * @param profile - Target profile
 * @param schemaBasePath - Optional override for the schema base directory
 * @returns Absolute path to the main XSD file
 */
function resolveXsdPath(profile: Profile, schemaBasePath?: string): string {
  const base = schemaBasePath ? path.join(schemaBasePath, "schema") : findSchemaDir(__dirname);
  const profileDir = path.join(base, PROFILE_SCHEMA_DIRS[profile]);
  const xsdFile = path.join(profileDir, PROFILE_MAIN_XSD[profile]);

  if (!fs.existsSync(xsdFile)) {
    throw new Error(
      `XSD schema file not found: ${xsdFile}. ` +
        "Ensure the schema files are installed with the package.",
    );
  }

  return xsdFile;
}

/**
 * Validates XML against the Factur-X XSD schema for a given profile.
 *
 * Uses `libxml2-wasm` (WASM port of libxml2) for full schema validation
 * including namespace imports.  The library is loaded via dynamic `import()`
 * to keep the package compatible with CommonJS consumers.
 *
 * @param xml     - The XML string to validate
 * @param profile - The Factur-X profile whose XSD to validate against
 * @param options - Optional settings (e.g. schema path override)
 * @returns Validation result with errors (if any)
 *
 * @example
 * ```ts
 * const result = await validateXsd(xmlString, Profile.EN16931);
 * if (!result.valid) {
 *   console.error('XSD errors:', result.errors);
 * }
 * ```
 */
export async function validateXsd(
  xml: string,
  profile: Profile,
  options?: XsdValidateOptions,
): Promise<XsdValidationResult> {
  const xsdPath = resolveXsdPath(profile, options?.schemaBasePath);

  const {
    XmlDocument,
    XsdValidator,
    XmlValidateError,
    xmlRegisterInputProvider,
    XmlBufferInputProvider,
  } = await import("libxml2-wasm");

  const schemaDir = path.dirname(xsdPath);
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".xsd"));
  const buffers: Record<string, Uint8Array> = {};
  for (const file of files) {
    const filePath = path.join(schemaDir, file);
    buffers[filePath] = fs.readFileSync(filePath);
    buffers[`file://${filePath}`] = buffers[filePath];
    buffers[file] = buffers[filePath];
  }

  const provider = new XmlBufferInputProvider(buffers);
  xmlRegisterInputProvider(provider);

  let xsdDoc;
  let validator;
  let xmlDoc;
  try {
    const xsdContent = fs.readFileSync(xsdPath, "utf-8");
    xsdDoc = XmlDocument.fromString(xsdContent, { url: `file://${xsdPath}` });
    validator = XsdValidator.fromDoc(xsdDoc);

    xmlDoc = XmlDocument.fromString(xml);
    validator.validate(xmlDoc);

    return { valid: true, errors: [] };
  } catch (err: unknown) {
    if (err instanceof XmlValidateError) {
      const errors: XsdValidationError[] = (err.details ?? []).map((d) => ({
        message: d.message,
        line: d.line,
        column: d.col,
      }));

      if (errors.length === 0) {
        errors.push({ message: err.message || "XSD validation failed" });
      }

      return { valid: false, errors };
    }
    throw err;
  } finally {
    xmlDoc?.dispose();
    validator?.dispose();
    xsdDoc?.dispose();
  }
}
