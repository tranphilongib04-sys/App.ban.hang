import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import path from 'path';

import { importDataAction } from '@/app/actions';

function getDataDir() {
  // Electron packaged build will set ELECTRON_USER_DATA
  const base = process.env.ELECTRON_USER_DATA ? process.env.ELECTRON_USER_DATA : process.cwd();
  const dir = path.join(base, 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * If `data/auto-import.tsv` exists, import it ONCE then rename file.
 * This lets us "auto import" your pasted dataset without any UI clicks.
 */
export async function runAutoImportIfPresent() {
  // In web mode (npm run dev), process.env.ELECTRON_USER_DATA might be undefined.
  // We should skip auto-import if we can't find the path, or default to a local 'data' folder.
  const userDataPath = process.env.ELECTRON_USER_DATA || process.cwd();
  const dataDir = path.join(userDataPath, 'data'); // Re-define dataDir based on userDataPath

  const importFilePath = path.join(dataDir, 'auto-import.tsv');
  if (!existsSync(importFilePath)) return null;

  const raw = readFileSync(importFilePath, 'utf8');
  const result = await importDataAction(raw);

  // Persist result for debugging
  const resultPath = path.join(dataDir, 'auto-import.result.json');
  try {
    writeFileSync(resultPath, JSON.stringify({ at: new Date().toISOString(), result }, null, 2), 'utf8');
  } catch { }

  // Rename input to avoid importing again
  const donePath = path.join(dataDir, `auto-import.done.${Date.now()}.tsv`);
  try {
    renameSync(importFilePath, donePath);
  } catch { }

  return result;
}
