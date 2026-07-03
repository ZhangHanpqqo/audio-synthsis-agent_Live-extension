import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function loadTextFile(filePath: string): Promise<string> {
  const trimmedPath = filePath.trim();
  if (!trimmedPath) {
    throw new Error("Text file path is required.");
  }

  if (path.extname(trimmedPath).toLowerCase() !== ".txt") {
    throw new Error("Only .txt files are supported.");
  }

  let stats;
  try {
    stats = await fs.stat(trimmedPath);
  } catch {
    throw new Error(`Text file does not exist: ${trimmedPath}`);
  }

  if (!stats.isFile()) {
    throw new Error(`Text file path is not a file: ${trimmedPath}`);
  }

  const text = await fs.readFile(trimmedPath, "utf8");
  if (!text.trim()) {
    throw new Error("Text file is empty.");
  }

  return text;
}
