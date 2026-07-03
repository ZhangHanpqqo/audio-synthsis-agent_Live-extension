import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { makeSafeTimestampedFilename } from "../src/files/outputPath.js";
import { loadTextFile } from "../src/files/textFile.js";

test("loadTextFile reads a valid .txt file", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tta-text-"));
  const filePath = path.join(dir, "input.txt");
  await fs.writeFile(filePath, "hello from a file", "utf8");

  assert.equal(await loadTextFile(filePath), "hello from a file");
});

test("loadTextFile rejects invalid paths and extensions", async () => {
  await assert.rejects(() => loadTextFile(""), /path is required/u);
  await assert.rejects(
    () => loadTextFile("/missing/file.txt"),
    /does not exist/u,
  );
  await assert.rejects(() => loadTextFile("/tmp/file.md"), /Only \.txt/u);
});

test("loadTextFile rejects empty text files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tta-empty-"));
  const filePath = path.join(dir, "empty.txt");
  await fs.writeFile(filePath, "   ", "utf8");

  await assert.rejects(() => loadTextFile(filePath), /empty/u);
});

test("makeSafeTimestampedFilename creates safe timestamped names", () => {
  const filename = makeSafeTimestampedFilename(
    "My Unsafe/File Name!!.wav",
    "wav",
    new Date("2026-07-01T08:30:45Z"),
  );

  assert.equal(filename, "my-unsafefile-name-2026-07-01T08-30-45Z.wav");
});
