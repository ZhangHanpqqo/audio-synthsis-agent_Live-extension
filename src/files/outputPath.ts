import * as fs from "node:fs/promises";
import * as path from "node:path";

const DEFAULT_BASENAME = "text-to-audio-agent";

export function makeSafeTimestampedFilename(
  requestedName: string | undefined,
  extension = "wav",
  now = new Date(),
): string {
  const baseName = sanitizeBasename(requestedName ?? DEFAULT_BASENAME);
  const timestamp = now
    .toISOString()
    .replace(/\.\d{3}Z$/u, "Z")
    .replace(/[:.]/gu, "-");
  const normalizedExtension = extension.replace(/^\./u, "").toLowerCase();

  return `${baseName}-${timestamp}.${normalizedExtension}`;
}

export async function resolveOutputPath(options: {
  outputDirectory: string;
  requestedName?: string;
  extension?: string;
  now?: Date;
}): Promise<string> {
  const outputDirectory = path.resolve(options.outputDirectory);
  await fs.mkdir(outputDirectory, { recursive: true });

  return path.join(
    outputDirectory,
    makeSafeTimestampedFilename(
      options.requestedName,
      options.extension ?? "wav",
      options.now,
    ),
  );
}

function sanitizeBasename(value: string): string {
  const withoutExtension = value.replace(/\.[a-z0-9]+$/iu, "");
  const safe = withoutExtension
    .normalize("NFKD")
    .replace(/[^\w -]/gu, "")
    .trim()
    .replace(/[\s_-]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .toLowerCase();

  return safe || DEFAULT_BASENAME;
}
