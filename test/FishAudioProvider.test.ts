import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import type { FishAudioConfig } from "../src/config.js";
import {
  buildFishTtsRequestBody,
  FishAudioProvider,
} from "../src/providers/FishAudioProvider.js";

const config: FishAudioConfig = {
  apiKey: "test-key",
  endpoint: "https://api.fish.audio/v1/tts",
  model: "s2-pro",
  format: "wav",
  sampleRate: 44100,
  temperature: 0.7,
  topP: 0.7,
  speed: 1,
  outputDirectory: "generated",
};

test("buildFishTtsRequestBody maps controls to Fish Audio payload", () => {
  const body = buildFishTtsRequestBody(
    {
      text: "  Hello Ableton  ",
      referenceId: "voice-id",
      temperature: 0.5,
      topP: 0.8,
      speed: 1.1,
    },
    config,
  );

  assert.equal(body.text, "Hello Ableton");
  assert.equal(body.reference_id, "voice-id");
  assert.equal(body.temperature, 0.5);
  assert.equal(body.top_p, 0.8);
  assert.equal(body.prosody.speed, 1.1);
  assert.equal(body.format, "wav");
  assert.equal(body.sample_rate, 44100);
});

test("FishAudioProvider sends expected request and writes WAV bytes", async () => {
  const outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "tta-"));
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(new Uint8Array([82, 73, 70, 70]), {
      status: 200,
      headers: { "content-type": "audio/wav" },
    });
  };

  const provider = new FishAudioProvider(
    { ...config, outputDirectory },
    fetchImpl as typeof fetch,
  );

  const result = await provider.generateAudio({
    text: "Hello",
    referenceId: "voice-id",
    outputFilename: "Ableton Test.wav",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, config.endpoint);
  assert.equal(calls[0]?.init.method, "POST");
  assert.deepEqual(calls[0]?.init.headers, {
    Authorization: "Bearer test-key",
    "Content-Type": "application/json",
    model: "s2-pro",
  });
  assert.match(path.basename(result.filePath), /^ableton-test-.*\.wav$/u);
  assert.equal(await fs.readFile(result.filePath, "utf8"), "RIFF");
});

test("FishAudioProvider accepts a request-level API key override", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(new Uint8Array([82, 73, 70, 70]), {
      status: 200,
      headers: { "content-type": "audio/wav" },
    });
  };

  const provider = new FishAudioProvider({ ...config, apiKey: undefined }, fetchImpl as typeof fetch);

  await provider.generateAudio({
    text: "Hello",
    referenceId: "voice-id",
    apiKey: "runtime-key",
  });

  assert.equal(calls[0]?.init.headers?.Authorization, "Bearer runtime-key");
});

test("FishAudioProvider rejects missing API key", async () => {
  const provider = new FishAudioProvider({ ...config, apiKey: undefined });

  await assert.rejects(
    () => provider.generateAudio({ text: "Hello", referenceId: "voice-id" }),
    /Missing Fish Audio API key/u,
  );
});

test("FishAudioProvider reports API failures", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ message: "bad request" }), {
      status: 422,
      headers: { "content-type": "application/json" },
    });
  const provider = new FishAudioProvider(config, fetchImpl as typeof fetch);

  await assert.rejects(
    () => provider.generateAudio({ text: "Hello", referenceId: "voice-id" }),
    /HTTP 422/u,
  );
});

test("FishAudioProvider reports network failures", async () => {
  const fetchImpl = async () => {
    throw new Error("socket closed");
  };
  const provider = new FishAudioProvider(config, fetchImpl as typeof fetch);

  await assert.rejects(
    () => provider.generateAudio({ text: "Hello", referenceId: "voice-id" }),
    /Network error calling Fish Audio: socket closed/u,
  );
});
