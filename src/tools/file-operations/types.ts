export type FileOperation =
  | "read"
  | "write"
  | "list"
  | "delete"
  | "exists"
  | "stat";

export interface FileReadInput {
  operation: "read";
  path: string;
  encoding?: "utf-8" | "base64" | "binary";
}

export interface FileWriteInput {
  operation: "write";
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
}

export interface FileListInput {
  operation: "list";
  path: string;
  recursive?: boolean;
  pattern?: string;
}

export interface FileDeleteInput {
  operation: "delete";
  path: string;
  recursive?: boolean;
}

export interface FileExistsInput {
  operation: "exists";
  path: string;
}

export interface FileStatInput {
  operation: "stat";
  path: string;
}

export type FileOperationsInput =
  | FileReadInput
  | FileWriteInput
  | FileListInput
  | FileDeleteInput
  | FileExistsInput
  | FileStatInput;

export interface FileInfo {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink";
  size?: number;
  created?: string;
  modified?: string;
  permissions?: string;
  target?: string; // For symlinks: the resolved target path
}

export type FileOperationsOutput =
  | { operation: "read"; content: string; encoding: string; size: number }
  | { operation: "write"; success: boolean; bytesWritten: number }
  | {
      operation: "list";
      files: FileInfo[];
      totalFiles: number;
      totalDirs: number;
    }
  | { operation: "delete"; success: boolean; deletedPath: string }
  | { operation: "exists"; exists: boolean; path: string }
  | { operation: "stat"; info: FileInfo };
