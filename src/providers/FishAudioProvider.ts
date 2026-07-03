import * as fs from "node:fs/promises";
import type { FishAudioConfig } from "../config.js";
import { resolveOutputPath } from "../files/outputPath.js";
import type {
  AudioGenerationResult,
  GenerateAudioRequest,
  GenerationFormat,
} from "../types.js";
import type { AudioGenerationProvider } from "./AudioGenerationProvider.js";

type FetchLike = typeof fetch;

export interface FishTtsRequestBody {
  text: string;
  reference_id: string;
  temperature: number;
  top_p: number;
  prosody: {
    speed: number;
    volume: number;
    normalize_loudness: boolean;
  };
  chunk_length: number;
  normalize: boolean;
  format: GenerationFormat;
  sample_rate: number;
  latency: "normal";
  max_new_tokens: number;
  repetition_penalty: number;
  min_chunk_length: number;
  condition_on_previous_chunks: boolean;
  early_stop_threshold: number;
}

export class FishAudioProvider implements AudioGenerationProvider {
  readonly name = "fish-audio";

  constructor(
    private readonly config: FishAudioConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async generateAudio(
    request: GenerateAudioRequest,
  ): Promise<AudioGenerationResult> {
    const config = resolveRequestConfig(this.config, request);
    const apiKey = resolveApiKey(config, request);
    validateRequest(config, request, apiKey);

    const body = buildFishTtsRequestBody(request, config);
    const response = await this.postToFishAudio(body, apiKey, config);
    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.byteLength === 0) {
      throw new Error("Fish Audio returned an empty audio response.");
    }

    const outputPathOptions: {
      outputDirectory: string;
      requestedName?: string;
      extension?: string;
    } = {
      outputDirectory: config.outputDirectory,
      extension: config.format,
    };
    if (request.outputFilename !== undefined) {
      outputPathOptions.requestedName = request.outputFilename;
    }

    const filePath = await resolveOutputPath(outputPathOptions);

    await fs.writeFile(filePath, bytes);

    return {
      provider: this.name,
      filePath,
      mimeType: response.headers.get("content-type") ?? undefined,
      bytes: bytes.byteLength,
    };
  }

  private async postToFishAudio(
    body: FishTtsRequestBody,
    apiKey: string,
    config: FishAudioConfig,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(config.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          model: config.model,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(
        `Network error calling Fish Audio: ${toErrorMessage(error)}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Fish Audio API failed with HTTP ${response.status}: ${await readErrorBody(
          response,
        )}`,
      );
    }

    return response;
  }
}

export function buildFishTtsRequestBody(
  request: GenerateAudioRequest,
  config: FishAudioConfig,
): FishTtsRequestBody {
  return {
    text: request.text.trim(),
    reference_id: request.referenceId.trim(),
    temperature: request.temperature ?? config.temperature,
    top_p: request.topP ?? config.topP,
    prosody: {
      speed: request.speed ?? config.speed,
      volume: 0,
      normalize_loudness: true,
    },
    chunk_length: 300,
    normalize: true,
    format: config.format,
    sample_rate: config.sampleRate,
    latency: "normal",
    max_new_tokens: 1024,
    repetition_penalty: 1.2,
    min_chunk_length: 50,
    condition_on_previous_chunks: true,
    early_stop_threshold: 1,
  };
}

function resolveApiKey(
  config: FishAudioConfig,
  request: GenerateAudioRequest,
): string {
  return request.apiKey?.trim() || config.apiKey?.trim() || "";
}

function resolveRequestConfig(
  config: FishAudioConfig,
  request: GenerateAudioRequest,
): FishAudioConfig {
  return {
    ...config,
    apiKey: request.apiKey?.trim() || config.apiKey,
    endpoint: request.endpoint?.trim() || config.endpoint,
    model: request.model?.trim() || config.model,
    format: request.format ?? config.format,
    sampleRate: request.sampleRate ?? config.sampleRate,
    temperature: request.temperature ?? config.temperature,
    topP: request.topP ?? config.topP,
    speed: request.speed ?? config.speed,
    outputDirectory: request.outputDirectory?.trim() || config.outputDirectory,
  };
}

function validateRequest(
  config: FishAudioConfig,
  request: GenerateAudioRequest,
  apiKey: string,
): void {
  if (!apiKey) {
    throw new Error(
      "Missing Fish Audio API key. Enter it in the dialog before generating audio.",
    );
  }

  if (!config.endpoint.trim()) {
    throw new Error("Fish Audio endpoint is required.");
  }

  if (!config.model.trim()) {
    throw new Error("Fish Audio model is required.");
  }

  if (!config.outputDirectory.trim()) {
    throw new Error("Output directory is required.");
  }

  if (!request.text.trim()) {
    throw new Error("Text is required before generating audio.");
  }

  if (!request.referenceId.trim()) {
    throw new Error("Fish Audio reference_id is required.");
  }
}

async function readErrorBody(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return JSON.stringify(await response.json());
    }
    return await response.text();
  } catch {
    return response.statusText || "No error details returned.";
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
