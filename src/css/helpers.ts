import fs from "fs";
import crypto from "crypto";
import { createContainerAt, getSolidDataset, isContainer, universalAccess } from "@inrupt/solid-client";
import { saveFileInContainer } from "@inrupt/solid-client";
import { lookup, extensions } from "mime-types";
import { readFile } from "fs/promises";
import { spawn } from 'node:child_process'

export async function runCommand(cmd: string, args: string[] = []) {
    const { stdout } = await spawn(cmd, args);
    return stdout
}

/**
 * Check if a container exists
 * @param url Container URL
 * @param authFetch Authenticated fetch function
 * @returns True if the container exists, false otherwise
 */
export async function containerExists(url: string, authFetch: any): Promise<boolean> {
    try {
        const ds = await getSolidDataset(url, {fetch:authFetch})
        return isContainer(ds)    
    } catch (error) {
        return false
    }
    
}

/**
 * Create a container if it does not yet exist
 * @param url Container URL
 * @param authFetch Authenticated fetch function
 */
export async function createContainer(url: string, authFetch: any): Promise<void> {
    if(!await containerExists(url, authFetch))
        await createContainerAt(url, {fetch:authFetch})
}

export function createFileHashIdentifier(filePath: string): string {
  // Read file contents
  const fileBuffer = fs.readFileSync(filePath);

  // Use current date (you can adjust granularity, e.g. only YYYY-MM-DD)
  const dateString = new Date().toISOString();

  // Create a hash
  const hash = crypto.createHash("sha256");

  // Update hash with file contents + date string
  hash.update(fileBuffer);
  hash.update(dateString);

  // Return hex digest
  return hash.digest("hex");
}

export function getMimeTypeByExtension(filePath: string): string {
  return lookup(filePath) || "application/octet-stream";
}

export function getExtensionByMimeType(mimeType: string): string|undefined {
  return extensions[mimeType]?.[0] || undefined;
}

export async function addFileToContainer(
  container: string, 
  inputFile: string,
  authFetch: any
) {

  // Create filename based on hash of file + date, with correct extension
  const fileIdentifier = createFileHashIdentifier(inputFile)
  const fileMimeType = getMimeTypeByExtension(inputFile)
  const fileExt = getExtensionByMimeType(fileMimeType)
  const fileName = `${fileIdentifier}${fileExt?'.'+fileExt:''}`
  const file = new File([new Uint8Array(await readFile(inputFile))], fileName)
  // Store file
  const result = await saveFileInContainer(container, file,
      {
          slug: fileName,
          contentType: fileMimeType,
          fetch: authFetch
      }
  )
  return result;
}