import path from "node:path";

export function appOrigin(requestUrl?: string) {
  const configured = process.env.ACCORD_APP_URL;
  if (configured) return new URL(configured).origin;
  if (requestUrl && isLoopback(new URL(requestUrl).hostname)) return new URL(requestUrl).origin;
  throw new Error("Set ACCORD_APP_URL to the Accord web address.");
}
export function isLoopback(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}
export function localMode(origin: string) {
  return process.env.ACCORD_LOCAL_MODE === "true" && isLoopback(new URL(origin).hostname) && !process.env.VERCEL;
}
export function cloudMode() { return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY); }
export function cloudRequested() { return !!(process.env.SUPABASE_URL || process.env.SUPABASE_SECRET_KEY); }
export function encryptionConfigured() {
  return !!process.env.ACCORD_ENCRYPTION_KEY && Buffer.from(process.env.ACCORD_ENCRYPTION_KEY, "base64").length === 32;
}
export function googleConfigured() { return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); }
export function dataDirectory() { return path.resolve(/* turbopackIgnore: true */ process.env.ACCORD_DATA_DIR || path.join(process.cwd(), ".accord")); }
export const MAX_CHUNK_BYTES = 3 * 1024 * 1024;
export const MAX_RECORDING_BYTES = 128 * 1024 * 1024;
export const MAX_DURATION_SECONDS = 2 * 60 * 60;
export const MAX_CHUNKS = 900;
export const SESSION_COOKIE = "accord_session";
export const BUCKET = "accord-recordings";
