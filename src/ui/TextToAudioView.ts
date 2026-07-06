export interface TextToAudioDialogResult {
  text: string;
  referenceId: string;
  temperature?: number;
  topP?: number;
  speed?: number;
  outputFilename?: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  format?: "wav" | "pcm" | "mp3" | "opus";
  sampleRate?: number;
  outputDirectory?: string;
}

export interface TextToAudioDialogDefaults {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  format?: "wav" | "pcm" | "mp3" | "opus";
  sampleRate?: number;
  temperature?: number;
  topP?: number;
  speed?: number;
  outputDirectory?: string;
}

export function createTextToAudioDialogHtml(
  defaults: TextToAudioDialogDefaults = {},
): string {
  const format = defaults.format ?? "wav";
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Text to Audio Agent with Fish Audio</title>
    <style>
      :root {
        --theme: rgb(211, 39, 93);
        --theme-soft: rgba(211, 39, 93, 0.2);
        --theme-line: rgba(211, 39, 93, 0.68);
        --theme-faint: rgba(211, 39, 93, 0.14);
        --text: #ffffff;
        --muted: rgba(255, 255, 255, 0.68);
        --panel: #080808;
        --black: #000000;
        color-scheme: dark;
        font-family: "Courier New", Courier, monospace;
        background: var(--black);
        color: var(--text);
      }

      * {
        box-sizing: border-box;
        font-family: inherit;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--black);
        color: var(--text);
      }

      main {
        display: grid;
        gap: 16px;
        padding: 20px;
      }

      h1 {
        margin: 0;
        border-bottom: 1px solid var(--theme-line);
        color: var(--theme);
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.15;
        padding-bottom: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 12px;
        font-weight: 650;
        color: var(--text);
      }

      textarea,
      input,
      select {
        width: 100%;
        border: 1px solid var(--theme-line);
        border-radius: 6px;
        background: var(--theme-soft);
        color: var(--text);
        font: inherit;
        font-size: 13px;
        outline: none;
        padding: 10px 11px;
      }

      textarea:focus,
      input:focus,
      select:focus {
        border-color: var(--theme);
        box-shadow: 0 0 0 2px var(--theme-faint);
      }

      textarea::placeholder,
      input::placeholder {
        color: var(--muted);
      }

      textarea {
        min-height: 176px;
        resize: vertical;
        line-height: 1.45;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .drop-zone {
        display: grid;
        gap: 4px;
        min-height: 82px;
        place-content: center;
        border: 1px dashed var(--theme-line);
        border-radius: 6px;
        background: var(--theme-faint);
        color: var(--muted);
        font-size: 12px;
        text-align: center;
      }

      .drop-zone.dragging {
        border-color: var(--theme);
        background: rgba(211, 39, 93, 0.24);
        color: var(--text);
      }

      .drop-zone strong {
        color: var(--text);
        font-size: 13px;
      }

      button {
        border: 1px solid var(--theme);
        border-radius: 6px;
        background: var(--theme);
        color: var(--black);
        font: inherit;
        font-weight: 700;
        padding: 10px 13px;
        cursor: pointer;
      }

      button.secondary {
        border-color: var(--theme-line);
        background: transparent;
        color: var(--text);
      }

      button:hover {
        filter: brightness(1.08);
      }

      .actions {
        justify-content: flex-end;
      }

      .settings {
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--theme-line);
        border-radius: 6px;
        background: var(--panel);
      }

      .settings .hint {
        font-size: 12px;
        color: var(--muted);
      }

      #status {
        min-height: 20px;
        color: var(--muted);
        font-size: 12px;
      }

      #status.error {
        color: var(--theme);
      }

      footer {
        border-top: 1px solid var(--theme-line);
        color: var(--muted);
        font-size: 11px;
        padding-top: 10px;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Text to Audio Agent with Fish Audio</h1>

      <label>
        Text
        <textarea id="text" placeholder="Type or load text to generate speech."></textarea>
      </label>

      <div class="drop-zone" id="drop-zone">
        <strong>Drop a .txt file here</strong>
        <span id="file-name">No file loaded</span>
      </div>

      <label>
        Fish Audio reference_id
        <input id="reference-id" autocomplete="off" placeholder="Required voice/model id" />
      </label>

      <div class="settings">
        <label>
          Fish Audio API key
          <input id="api-key" type="password" autocomplete="off" value="${escapeAttribute(defaults.apiKey)}" placeholder="Required" />
        </label>
        <div class="grid">
          <label>
            Endpoint
            <input id="endpoint" autocomplete="off" value="${escapeAttribute(defaults.endpoint ?? "https://api.fish.audio/v1/tts")}" />
          </label>
          <label>
            Model
            <input id="model" autocomplete="off" value="${escapeAttribute(defaults.model ?? "s2-pro")}" />
          </label>
          <label>
            Format
            <select id="format">
              <option value="wav"${format === "wav" ? " selected" : ""}>wav</option>
              <option value="mp3"${format === "mp3" ? " selected" : ""}>mp3</option>
              <option value="opus"${format === "opus" ? " selected" : ""}>opus</option>
              <option value="pcm"${format === "pcm" ? " selected" : ""}>pcm</option>
            </select>
          </label>
          <label>
            Sample rate
            <input id="sample-rate" inputmode="numeric" value="${escapeAttribute(defaults.sampleRate ?? 44100)}" />
          </label>
          <label>
            Output directory
            <input id="output-directory" autocomplete="off" value="${escapeAttribute(defaults.outputDirectory ?? "generated")}" />
          </label>
        </div>
        <div class="hint">These settings are sent with this generation request instead of being read from a .env file.</div>
      </div>

      <div class="grid">
        <label>
          Temperature
          <input id="temperature" inputmode="decimal" value="${escapeAttribute(defaults.temperature ?? 0.7)}" />
        </label>
        <label>
          Top P
          <input id="top-p" inputmode="decimal" value="${escapeAttribute(defaults.topP ?? 0.7)}" />
        </label>
        <label>
          Speed
          <input id="speed" inputmode="decimal" value="${escapeAttribute(defaults.speed ?? 1)}" />
        </label>
        <label>
          Output filename
          <input id="output-filename" autocomplete="off" placeholder="Optional" />
        </label>
      </div>

      <div id="status" role="status" aria-live="polite"></div>

      <div class="actions">
        <button class="secondary" id="cancel" type="button">Cancel</button>
        <button id="generate" type="button">Generate Audio</button>
      </div>

      <footer>by N6ZHH</footer>
    </main>

    <script>
      const text = document.getElementById("text");
      const dropZone = document.getElementById("drop-zone");
      const fileName = document.getElementById("file-name");
      const referenceId = document.getElementById("reference-id");
      const apiKey = document.getElementById("api-key");
      const endpoint = document.getElementById("endpoint");
      const model = document.getElementById("model");
      const format = document.getElementById("format");
      const sampleRate = document.getElementById("sample-rate");
      const outputDirectory = document.getElementById("output-directory");
      const temperature = document.getElementById("temperature");
      const topP = document.getElementById("top-p");
      const speed = document.getElementById("speed");
      const outputFilename = document.getElementById("output-filename");
      const status = document.getElementById("status");

      function setStatus(message, isError = false) {
        status.textContent = message;
        status.className = isError ? "error" : "";
      }

      function parseOptionalNumber(input, label) {
        const value = input.value.trim();
        if (!value) return undefined;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          throw new Error(label + " must be a number.");
        }
        return parsed;
      }

      function postToLive(payload) {
        const message = { method: "close_and_send", params: [JSON.stringify(payload)] };
        if (window.webkit?.messageHandlers?.live) {
          window.webkit.messageHandlers.live.postMessage(message);
          return;
        }
        if (window.chrome?.webview) {
          window.chrome.webview.postMessage(message);
          return;
        }
        setStatus("Unable to communicate with the Ableton extension host.", true);
      }

      async function loadDroppedTextFile(file) {
        if (!file) {
          fileName.textContent = "No file loaded";
          return;
        }
        if (!file.name.toLowerCase().endsWith(".txt")) {
          setStatus("Only .txt files are supported.", true);
          fileName.textContent = file.name;
          return;
        }
        try {
          text.value = await file.text();
          fileName.textContent = file.name;
          setStatus("Text file loaded.");
        } catch (error) {
          setStatus(error instanceof Error ? error.message : String(error), true);
        }
      }

      dropZone.addEventListener("dragenter", (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
      });

      dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      dropZone.addEventListener("dragleave", (event) => {
        if (!dropZone.contains(event.relatedTarget)) {
          dropZone.classList.remove("dragging");
        }
      });

      dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
        const file = event.dataTransfer && event.dataTransfer.files[0];
        void loadDroppedTextFile(file);
      });

      document.getElementById("cancel").addEventListener("click", () => {
        postToLive({ cancelled: true });
      });

      document.getElementById("generate").addEventListener("click", () => {
        try {
          if (!text.value.trim()) {
            throw new Error("Text is required.");
          }
          if (!referenceId.value.trim()) {
            throw new Error("Fish Audio reference_id is required.");
          }
          if (!apiKey.value.trim()) {
            throw new Error("Fish Audio API key is required.");
          }
          if (!endpoint.value.trim()) {
            throw new Error("Fish Audio endpoint is required.");
          }
          if (!model.value.trim()) {
            throw new Error("Fish Audio model is required.");
          }
          if (!outputDirectory.value.trim()) {
            throw new Error("Output directory is required.");
          }

          setStatus("Sending request to extension...");
          postToLive({
            text: text.value,
            referenceId: referenceId.value,
            apiKey: apiKey.value.trim(),
            endpoint: endpoint.value.trim(),
            model: model.value.trim(),
            format: format.value,
            sampleRate: parseOptionalNumber(sampleRate, "Sample rate"),
            outputDirectory: outputDirectory.value.trim(),
            temperature: parseOptionalNumber(temperature, "Temperature"),
            topP: parseOptionalNumber(topP, "Top P"),
            speed: parseOptionalNumber(speed, "Speed"),
            outputFilename: outputFilename.value.trim() || undefined
          });
        } catch (error) {
          setStatus(error instanceof Error ? error.message : String(error), true);
        }
      });
    </script>
  </body>
</html>`;
}

function escapeAttribute(value: string | number | undefined): string {
  return String(value ?? "")
    .replace(/&/gu, "&amp;")
    .replace(/"/gu, "&quot;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}