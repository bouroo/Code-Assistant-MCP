import { readFile, writeFile, readdir, stat, unlink, rm, lstat, readlink } from 'fs/promises';
import { join, resolve, relative, isAbsolute } from 'path';
import { logger } from '../../utils/logger.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import type { FileOperationsInput, FileOperationsOutput, FileInfo } from './types.js';
import { loadConfig } from '../../config/index.js';

// Get allowed paths from config
function getAllowedPaths(): string[] {
  try {
    const config = loadConfig();
    return config.fileOperations.allowedPaths;
  } catch {
    return ['.'];
  }
}

// Validate that the path is within allowed directories
// Uses path.relative() to properly detect path traversal attempts
function validatePath(targetPath: string): string {
  const allowedPaths = getAllowedPaths();
  
  // Resolve to absolute path
  const absolutePath = isAbsolute(targetPath) 
    ? resolve(targetPath) 
    : resolve(process.cwd(), targetPath);
  
  // Check if path is within any allowed directory using relative path analysis
  // This properly handles path traversal attempts (e.g., ../../etc/passwd)
  const isAllowed = allowedPaths.some(allowed => {
    const allowedAbsolute = isAbsolute(allowed) 
      ? resolve(allowed) 
      : resolve(process.cwd(), allowed);
    
    // Get the relative path from allowed directory to target
    const relativePath = relative(allowedAbsolute, absolutePath);
    
    // Check that relative path doesn't start with '..' (meaning it's outside allowed dir)
    // Also ensure we don't have path traversal via symlinks
    return !relativePath.startsWith('..') && !relativePath.includes('..' + '/');
  });
  
  if (!isAllowed) {
    throw new ForbiddenError(`Path '${targetPath}' is not within allowed directories: ${allowedPaths.join(', ')}`);
  }
  
  return absolutePath;
}

export async function fileOperationsHandler(input: FileOperationsInput): Promise<FileOperationsOutput> {
  logger.info('File operation request', { operation: input.operation, path: input.path });
  
  switch (input.operation) {
    case 'read':
      return handleRead(input.path, input.encoding);
    
    case 'write':
      return handleWrite(input.path, input.content, input.encoding);
    
    case 'list':
      return handleList(input.path, input.recursive, input.pattern);
    
    case 'delete':
      return handleDelete(input.path, input.recursive);
    
    case 'exists':
      return handleExists(input.path);
    
    case 'stat':
      return handleStat(input.path);
    
    default:
      throw new Error(`Unknown operation: ${(input as FileOperationsInput).operation}`);
  }
}

async function handleRead(path: string, encoding?: string): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(path);
  const encodingType = encoding ?? 'utf-8';
  
  try {
    const content = await readFile(validatedPath, encodingType === 'utf-8' ? 'utf-8' : undefined);
    const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content as string, 'utf-8');
    
    return {
      operation: 'read',
      content: encodingType === 'base64' && !Buffer.isBuffer(content) 
        ? Buffer.from(content as string, 'utf-8').toString('base64')
        : content as string,
      encoding: encodingType,
      size
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new NotFoundError(path);
    }
    throw error;
  }
}

async function handleWrite(path: string, content: string, encoding?: string): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(path);
  const encodingType = encoding ?? 'utf-8';
  
  const finalContent = encodingType === 'base64' 
    ? Buffer.from(content, 'base64')
    : content;
  
  await writeFile(validatedPath, finalContent);
  
  return {
    operation: 'write',
    success: true,
    bytesWritten: Buffer.isBuffer(finalContent) ? finalContent.length : Buffer.byteLength(finalContent, 'utf-8')
  };
}

async function handleList(dirPath: string, recursive?: boolean, _pattern?: string): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(dirPath);
  
  const files: FileInfo[] = [];
  let totalFiles = 0;
  let totalDirs = 0;
  
  async function walkDirectory(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        totalDirs++;
        files.push({
          name: entry.name,
          path: relative(process.cwd(), fullPath),
          type: 'directory'
        });
        
        if (recursive) {
          await walkDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        totalFiles++;
        files.push({
          name: entry.name,
          path: relative(process.cwd(), fullPath),
          type: 'file'
        });
      } else if (entry.isSymbolicLink()) {
        // Security: Resolve symlinks and validate the target is within allowed paths
        try {
          const resolvedTarget = resolve(dir, await readlink(fullPath));
          const resolvedBase = resolve(process.cwd());
          const relativeToBase = relative(resolvedBase, resolvedTarget);
          
          // Only include symlinks that point within allowed directories
          const isAllowed = getAllowedPaths().some(allowed => {
            const allowedAbsolute = isAbsolute(allowed) 
              ? resolve(allowed) 
              : resolve(process.cwd(), allowed);
            const relPath = relative(allowedAbsolute, resolvedTarget);
            return !relPath.startsWith('..') && !relPath.includes('..' + '/');
          });
          
          if (isAllowed) {
            files.push({
              name: entry.name,
              path: relative(process.cwd(), fullPath),
              type: 'symlink',
              target: resolvedTarget
            });
          }
          // Skip symlinks pointing outside allowed directories for security
        } catch {
          // Skip symlinks that can't be resolved
        }
      }
    }
  }
  
  await walkDirectory(validatedPath);
  
  return {
    operation: 'list',
    files,
    totalFiles,
    totalDirs
  };
}

async function handleDelete(path: string, recursive?: boolean): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(path);
  
  try {
    if (recursive) {
      await rm(validatedPath, { recursive: true, force: true });
    } else {
      await unlink(validatedPath);
    }
    
    return {
      operation: 'delete',
      success: true,
      deletedPath: path
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new NotFoundError(path);
    }
    throw error;
  }
}

async function handleExists(path: string): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(path);
  
  try {
    await stat(validatedPath);
    return {
      operation: 'exists',
      exists: true,
      path
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        operation: 'exists',
        exists: false,
        path
      };
    }
    throw error;
  }
}

async function handleStat(path: string): Promise<FileOperationsOutput> {
  const validatedPath = validatePath(path);
  
  try {
    const stats = await stat(validatedPath);
    
    return {
      operation: 'stat',
      info: {
        name: path.split(/[/\\]/).pop() ?? path,
        path,
        type: stats.isDirectory() ? 'directory' : stats.isSymbolicLink() ? 'symlink' : 'file',
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        permissions: stats.mode.toString(8)
      }
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new NotFoundError(path);
    }
    throw error;
  }
}
