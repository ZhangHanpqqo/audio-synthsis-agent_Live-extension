import {
  AudioTrack,
  ClipSlot,
  type ArrangementSelection,
  type Handle,
} from "@ableton-extensions/sdk";
import type {
  AbletonImportResult,
  AbletonImportTarget,
  LiveExtensionContext,
} from "../types.js";

export async function importAudioIntoLive(
  context: LiveExtensionContext,
  filePath: string,
  target: AbletonImportTarget,
): Promise<AbletonImportResult> {
  // Ableton SDK call: copy the generated file into the Live project first.
  // The SDK docs say subsequent clip creation should use the returned path.
  const importedProjectPath =
    await context.resources.importIntoProject(filePath);

  switch (target.type) {
    case "clip-slot":
      await importIntoClipSlot(context, importedProjectPath, target.handle);
      return {
        importedProjectPath,
        targetDescription: "session clip slot",
      };

    case "audio-track":
      await importIntoAudioTrack(
        context,
        importedProjectPath,
        target.handle,
        0,
      );
      return {
        importedProjectPath,
        targetDescription: "audio track arrangement at beat 0",
      };

    case "arrangement-selection":
      await importIntoArrangementSelection(
        context,
        importedProjectPath,
        target.selection,
      );
      return {
        importedProjectPath,
        targetDescription: "arrangement selection",
      };

    case "new-audio-track": {
      // Ableton SDK call: Live inserts a new audio track after the last selected
      // track, or appends it if no track is selected.
      const track = await context.application.song.createAudioTrack();
      track.name = "Text to Audio Agent";
      // Ableton SDK call: create an arrangement audio clip from the imported WAV.
      await track.createAudioClip({
        filePath: importedProjectPath,
        startTime: 0,
        isWarped: false,
      });
      return {
        importedProjectPath,
        targetDescription: "new audio track arrangement at beat 0",
      };
    }
  }
}

async function importIntoClipSlot(
  context: LiveExtensionContext,
  filePath: string,
  handle: Handle,
): Promise<void> {
  const clipSlot = context.getObjectFromHandle(handle, ClipSlot);
  if (clipSlot.clip) {
    await clipSlot.deleteClip();
  }

  // Ableton SDK call: create a Session View audio clip in the selected slot.
  await clipSlot.createAudioClip({
    filePath,
    isWarped: false,
  });
}

async function importIntoAudioTrack(
  context: LiveExtensionContext,
  filePath: string,
  handle: Handle,
  startTime: number,
): Promise<void> {
  const track = context.getObjectFromHandle(handle, AudioTrack);
  // Ableton SDK call: create an Arrangement View audio clip on this audio track.
  await track.createAudioClip({
    filePath,
    startTime,
    isWarped: false,
  });
}

async function importIntoArrangementSelection(
  context: LiveExtensionContext,
  filePath: string,
  selection: ArrangementSelection,
): Promise<void> {
  const firstLane = selection.selected_lanes[0];
  if (!firstLane) {
    throw new Error("No selected arrangement lane was provided by Ableton.");
  }

  const track = context.getObjectFromHandle(firstLane, AudioTrack);
  const duration =
    selection.time_selection_end > selection.time_selection_start
      ? selection.time_selection_end - selection.time_selection_start
      : undefined;

  const clipArgs: Parameters<typeof track.createAudioClip>[0] = {
    filePath,
    startTime: selection.time_selection_start,
    isWarped: false,
  };
  if (duration !== undefined) {
    clipArgs.duration = duration;
  }

  // Ableton SDK call: place the generated audio at the arrangement selection.
  await track.createAudioClip(clipArgs);
}
