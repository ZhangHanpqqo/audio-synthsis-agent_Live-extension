import {
  ClipSlot,
  type ActivationContext,
  type ArrangementSelection,
  type ClipSlotSelection,
  type Handle,
} from "@ableton-extensions/sdk";
import { initialize } from "@ableton-extensions/sdk";
import { importAudioIntoLive } from "./ableton/AbletonAudioImporter.js";
import { DEFAULT_FISH_AUDIO_CONFIG, loadFishAudioConfig } from "./config.js";
import {
  configureLogger,
  getLogFilePath,
  logError,
  logInfo,
} from "./logger.js";
import { FishAudioProvider } from "./providers/FishAudioProvider.js";
import type {
  AbletonImportTarget,
  GenerateAudioRequest,
  LiveExtensionContext,
} from "./types.js";
import {
  createTextToAudioDialogHtml,
  type TextToAudioDialogResult,
} from "./ui/TextToAudioView.js";

const COMMAND_ID = "audio-synthsis-agent-live-extension.showDialog";

export function activate(activation: ActivationContext) {
  try {
    activateExtension(activation);
  } catch (error) {
    logError("Extension activation failed", error);
    throw error;
  }
}

function activateExtension(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");
  const logPath = configureLogger(
    context.environment.storageDirectory ?? context.environment.tempDirectory,
  );
  logInfo("Activating Text to Audio Agent extension");

  const config = loadConfigWithFallback(context);
  const provider = new FishAudioProvider(config);

  context.commands.registerCommand(COMMAND_ID, (...args: unknown[]) => {
    void openTextToAudioDialog(context, provider, args[0]).catch((error) => {
      logError("Text to Audio Agent command failed", error);
      console.error(
        `Text to Audio Agent failed: ${toErrorMessage(error)}. See ${logPath}`,
      );
    });
  });

  void context.ui.registerContextMenuAction(
    "AudioTrack",
    "Open audio-synthsis-agent-live-extension",
    COMMAND_ID,
  ).catch((error) => logError("Failed to register AudioTrack context menu", error));
  void context.ui
    .registerContextMenuAction("ClipSlot", "Generate audio here", COMMAND_ID)
    .catch((error) => logError("Failed to register ClipSlot context menu", error));
  void context.ui.registerContextMenuAction(
    "AudioTrack.ArrangementSelection",
    "Generate audio in selection",
    COMMAND_ID,
  ).catch((error) =>
    logError("Failed to register arrangement selection context menu", error),
  );

  logInfo(`Text to Audio Agent activated. Log file: ${getLogFilePath()}`);
}

async function openTextToAudioDialog(
  context: LiveExtensionContext,
  provider: FishAudioProvider,
  targetArg: unknown,
): Promise<void> {
  logInfo("Opening text-to-audio dialog");
  const url = `data:text/html,${encodeURIComponent(
    createTextToAudioDialogHtml(loadConfigWithFallback(context)),
  )}`;
  const dialogResult = await context.ui.showModalDialog(url, 760, 760);
  const request = parseDialogResult(dialogResult);
  if (request === undefined) {
    logInfo("Dialog cancelled");
    return;
  }

  const target = resolveImportTarget(context, targetArg);
  await context.ui.withinProgressDialog(
    "Generating audio...",
    { progress: 10 },
    async (update, abortSignal) => {
      await update("Generating audio with Fish Audio...", 25);
      const audio = await provider.generateAudio(request);

      if (abortSignal.aborted) {
        return;
      }

      await update("Importing audio into Live...", 80);
      const imported = await importAudioIntoLive(context, audio.filePath, target);
      await update(`Imported to ${imported.targetDescription}.`, 100);
      logInfo(
        `Generated ${audio.bytes} bytes via ${audio.provider}; imported ${imported.importedProjectPath}`,
      );
    },
  );
}

function loadConfigWithFallback(context: LiveExtensionContext) {
  try {
    return loadFishAudioConfig({
      storageDirectory: context.environment.storageDirectory,
      tempDirectory: context.environment.tempDirectory,
    });
  } catch (error) {
    logError("Failed to load local Fish Audio config; using UI defaults", error);
    return {
      ...DEFAULT_FISH_AUDIO_CONFIG,
      outputDirectory:
        context.environment.tempDirectory ??
        DEFAULT_FISH_AUDIO_CONFIG.outputDirectory,
    };
  }
}

function parseDialogResult(result: string): GenerateAudioRequest | undefined {
  const parsed = JSON.parse(result) as TextToAudioDialogResult & {
    cancelled?: boolean;
  };

  if (parsed.cancelled) {
    return undefined;
  }

  return {
    text: parsed.text,
    referenceId: parsed.referenceId,
    temperature: parsed.temperature,
    topP: parsed.topP,
    speed: parsed.speed,
    outputFilename: parsed.outputFilename,
    apiKey: parsed.apiKey,
    endpoint: parsed.endpoint,
    model: parsed.model,
    format: parsed.format,
    sampleRate: parsed.sampleRate,
    outputDirectory: parsed.outputDirectory,
  };
}

function resolveImportTarget(
  context: LiveExtensionContext,
  targetArg: unknown,
): AbletonImportTarget {
  if (isArrangementSelection(targetArg)) {
    return { type: "arrangement-selection", selection: targetArg };
  }

  if (isClipSlotSelection(targetArg)) {
    const firstSlot = targetArg.selected_clip_slots[0];
    if (firstSlot !== undefined) {
      return { type: "clip-slot", handle: firstSlot };
    }
  }

  if (isHandle(targetArg)) {
    try {
      context.getObjectFromHandle(targetArg, ClipSlot);
      return { type: "clip-slot", handle: targetArg };
    } catch {
      return { type: "audio-track", handle: targetArg };
    }
  }

  return { type: "new-audio-track" };
}

function isHandle(value: unknown): value is Handle {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "bigint"
  );
}

function isArrangementSelection(value: unknown): value is ArrangementSelection {
  return (
    typeof value === "object" &&
    value !== null &&
    "time_selection_start" in value &&
    "time_selection_end" in value &&
    "selected_lanes" in value &&
    Array.isArray(value.selected_lanes)
  );
}

function isClipSlotSelection(value: unknown): value is ClipSlotSelection {
  return (
    typeof value === "object" &&
    value !== null &&
    "selected_clip_slots" in value &&
    Array.isArray(value.selected_clip_slots)
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
