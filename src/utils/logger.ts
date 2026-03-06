import pino from "pino";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import type { Config } from "../config/schema";

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

  // File logging for production
  if (config.logging.file.enabled) {
    const logDir = dirname(config.logging.file.path);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    streams.push({
      level: config.logging.level,
      stream: pino.destination({
        dest: config.logging.file.path,
        sync: false,
      }),
    });
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
