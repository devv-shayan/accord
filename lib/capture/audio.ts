import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";

const execute = promisify(execFile);
export async function normalizeAudio(input: string, output: string) {
  if (!ffmpeg && !process.env.FFMPEG_PATH) throw new Error("The audio processor is not installed.");
  // The recorder clock excludes pauses. Rebuild continuous audio timestamps to match it.
  await execute(process.env.FFMPEG_PATH || ffmpeg!, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", input, "-map", "0:a:0", "-af", "asetpts=N/SR/TB", "-c:a", "libopus", "-b:a", "64k", "-y", output], { timeout: 180_000, maxBuffer: 512_000 });
}
export async function cropAudio(input: string, output: string, start: number, end: number) {
  await execute(process.env.FFMPEG_PATH || ffmpeg!, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", input, "-ss", String(start), "-t", String(end - start), "-map", "0:a:0", "-c:a", "libopus", "-b:a", "64k", "-y", output], { timeout: 120_000, maxBuffer: 512_000 });
}
export async function audioDuration(filename: string): Promise<number> {
  let stderr = "";
  try { await execute(process.env.FFMPEG_PATH || ffmpeg!, ["-hide_banner", "-i", filename], { timeout: 10_000, maxBuffer: 512_000 }); }
  catch (error) { stderr = (error as { stderr?: string }).stderr || ""; }
  const match = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error("The audio processor could not read the recording length.");
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}
