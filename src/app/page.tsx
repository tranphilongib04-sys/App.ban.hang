import { redirect } from 'next/navigation';
import { runAutoImportIfPresent } from '@/lib/auto-import';

export default async function Home() {
  // Auto-import once if user dropped data file in /data/auto-import.tsv
  // This avoids any manual UI steps.
  try {
    await runAutoImportIfPresent();
  } catch (error) {
    console.error("Auto import failed:", error);
    // Continue to dashboard despite import error
  }
  redirect('/today');
}
