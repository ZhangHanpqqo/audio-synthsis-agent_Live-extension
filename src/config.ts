import * as fs from "node:fs";
import * as path from "node:path";
import type { GenerationFormat } from "./types.js";

export interface FishAudioConfig {
  apiKey?: string | undefined;
  endpoint: string;
  model: string;
  format: GenerationFormat;
  sampleRate: number;
  temperature: number;
  topP: number;
  speed: number;
  outputDirectory: string;
}

interface LocalConfigFile {
  fishApiKey?: string;
  fishApiEndpoint?: string;
  fishModel?: string;
  fishAudioFormat?: GenerationFormat;
  fishSampleRate?: number;
  fishTemperature?: number;
  fishTopP?: number;
  fishSpeed?: number;
  fishOutputDirectory?: string;
}

export const DEFAULT_FISH_AUDIO_CONFIG: FishAudioConfig = {
  endpoint: "https://api.fish.audio/v1/tts",
  model: "s2-pro",
  format: "wav",
  sampleRate: 44100,
  temperature: 0.7,
  topP: 0.7,
  speed: 1,
  outputDirectory: "generated",
};

const CONFIG_FILE_NAME = "text-to-audio-agent.config.json";

export function loadFishAudioConfig(
  options: {
    cwd?: string;
    storageDirectory?: string;
    tempDirectory?: string;
  } = {},
): FishAudioConfig {
  const cwd = options.cwd ?? process.cwd();

  const localConfig =
    readLocalConfig(path.join(cwd, CONFIG_FILE_NAME)) ??
    (options.storageDirectory
      ? readLocalConfig(path.join(options.storageDirectory, CONFIG_FILE_NAME))
      : undefined) ??
    {};

  const outputDirectory =
    readString(localConfig.fishOutputDirectory) ??
    options.tempDirectory ??
    DEFAULT_FISH_AUDIO_CONFIG.outputDirectory;

  const config: FishAudioConfig = {
    endpoint:
      readString(localConfig.fishApiEndpoint) ??
      DEFAULT_FISH_AUDIO_CONFIG.endpoint,
    model:
      readString(localConfig.fishModel) ?? DEFAULT_FISH_AUDIO_CONFIG.model,
    format: readFormat(localConfig.fishAudioFormat),
    sampleRate: readNumber(
      localConfig.fishSampleRate,
      DEFAULT_FISH_AUDIO_CONFIG.sampleRate,
    ),
    temperature: readNumber(
      localConfig.fishTemperature,
      DEFAULT_FISH_AUDIO_CONFIG.temperature,
    ),
    topP: readNumber(localConfig.fishTopP, DEFAULT_FISH_AUDIO_CONFIG.topP),
    speed: readNumber(
      localConfig.fishSpeed,
      DEFAULT_FISH_AUDIO_CONFIG.speed,
    ),
    outputDirectory,
  };

  const apiKey = readString(localConfig.fishApiKey);
  if (apiKey !== undefined) {
    config.apiKey = apiKey;
  }

  return config;
}

function readLocalConfig(filePath: string): LocalConfigFile | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as LocalConfigFile;
  } catch (error) {
    throw new Error(
      `Invalid local config file at ${filePath}: ${toErrorMessage(error)}`,
    );
  }
}

function readString(localValue: string | undefined): string | undefined {
  const value = localValue;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readNumber(
  localValue: number | undefined,
  fallback: number,
): number {
  return localValue ?? fallback;
}

function readFormat(
  localValue: GenerationFormat | undefined,
): GenerationFormat {
  const value = localValue ?? DEFAULT_FISH_AUDIO_CONFIG.format;
  if (
    value === "wav" ||
    value === "pcm" ||
    value === "mp3" ||
    value === "opus"
  ) {
    return value;
  }

  throw new Error("fishAudioFormat must be one of wav, pcm, mp3, or opus.");
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
