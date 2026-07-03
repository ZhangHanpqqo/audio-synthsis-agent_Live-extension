import * as fs from "node:fs";
import * as path from "node:path";

const LOG_FILE_NAME = "text-to-audio-agent.log";

let logFilePath = path.resolve(LOG_FILE_NAME);
let handlersInstalled = false;

export function configureLogger(directory: string | undefined): string {
  logFilePath = path.join(directory ?? process.cwd(), LOG_FILE_NAME);
  ensureLogDirectory();
  installProcessErrorHandlers();
  logInfo(`Logging to ${logFilePath}`);
  return logFilePath;
}

export function logInfo(message: string): void {
  writeLog("info", message);
}

export function logError(message: string, error?: unknown): void {
  writeLog("error", `${message}${error ? `\n${formatError(error)}` : ""}`);
}

export function getLogFilePath(): string {
  return logFilePath;
}

function installProcessErrorHandlers(): void {
  if (handlersInstalled) {
    return;
  }

  handlersInstalled = true;
  process.on("uncaughtException", (error) => {
    logError("Uncaught exception", error);
  });
  process.on("unhandledRejection", (reason) => {
    logError("Unhandled promise rejection", reason);
  });
}

function writeLog(level: "info" | "error", message: string): void {
  try {
    ensureLogDirectory();
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${level.toUpperCase()} ${message}\n`);
  } catch {
    // Logging should never be able to crash the extension host.
  }
}

function ensureLogDirectory(): void {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trim();
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
