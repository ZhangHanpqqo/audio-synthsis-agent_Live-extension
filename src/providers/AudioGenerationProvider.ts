import type { AudioGenerationResult, GenerateAudioRequest } from "../types.js";

export interface AudioGenerationProvider {
  readonly name: string;
  generateAudio(request: GenerateAudioRequest): Promise<AudioGenerationResult>;
}
