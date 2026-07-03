import type {
  ArrangementSelection,
  ClipSlot,
  ExtensionContext,
  Handle,
} from "@ableton-extensions/sdk";

export type ApiVersion = "1.0.0";

export type GenerationFormat = "wav" | "pcm" | "mp3" | "opus";

export interface GenerationControls {
  referenceId: string;
  temperature?: number;
  topP?: number;
  speed?: number;
  outputFilename?: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  format?: GenerationFormat;
  sampleRate?: number;
  outputDirectory?: string;
}

export interface GenerateAudioRequest extends GenerationControls {
  text: string;
}

export interface AudioGenerationResult {
  provider: string;
  filePath: string;
  mimeType?: string | undefined;
  bytes: number;
}

export type AbletonImportTarget =
  | { type: "new-audio-track" }
  | { type: "audio-track"; handle: Handle }
  | { type: "arrangement-selection"; selection: ArrangementSelection }
  | { type: "clip-slot"; handle: Handle };

export interface AbletonImportResult {
  importedProjectPath: string;
  targetDescription: string;
}

export type LiveExtensionContext = ExtensionContext<ApiVersion>;
export type LiveClipSlot = ClipSlot<ApiVersion>;
