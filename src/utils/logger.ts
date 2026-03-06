import pino from "pino";
import { mkdirSync, existsSync, accessSync, constants } from "fs";
import { dirname } from "path";
import type { Config } from "../config/schema";

/**
 * Check if a directory is writable by attempting to access it with write permissions.
 * Returns true if the directory exists and is writable, or if it can be created.
 */
function isDirectoryWritable(dirPath: string): boolean {
  try {
    if (existsSync(dirPath)) {
      accessSync(dirPath, constants.W_OK);
      return true;
    }
    // Directory doesn't exist, check if parent is writable
    const parentDir = dirname(dirPath);
    if (existsSync(parentDir)) {
      accessSync(parentDir, constants.W_OK);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Attempt to create log directory, returning true if successful or already exists.
 * Returns false if the filesystem is read-only or directory cannot be created.
 */
function ensureLogDirectory(logDir: string): boolean {
  try {
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export function createLogger(config: Config) {
  const streams: pino.StreamEntry[] = [];

  // Pretty-printed stdout for development
  if (config.logging.prettyPrint) {
    streams.push({
      level: config.logging.level,
      stream: pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }),
    });
  } else {
    streams.push({
      level: config.logging.level,
      stream: process.stdout,
    });
  }

  // File logging for production - with read-only filesystem handling
  if (config.logging.file.enabled) {
    const logDir = dirname(config.logging.file.path);
    const canWriteFiles = isDirectoryWritable(logDir) && ensureLogDirectory(logDir);

    if (canWriteFiles) {
      try {
        streams.push({
          level: config.logging.level,
          stream: pino.destination({
            dest: config.logging.file.path,
            sync: false,
          }),
        });
      } catch {
        // Silently skip file logging if destination creation fails
      }
    }
    // If read-only filesystem, gracefully fall back to console-only logging
  }

  return pino(
    {
      name: config.server.name,
      level: config.logging.level,
    },
    pino.multistream(streams),
  );
}

export type Logger = ReturnType<typeof createLogger>;
