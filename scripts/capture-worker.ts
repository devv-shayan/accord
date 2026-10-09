import { processCapture, queuedCaptures } from "../lib/capture/processing";

let stopped = false;
process.on("SIGINT", () => { stopped = true; });
process.on("SIGTERM", () => { stopped = true; });
async function run() {
  console.log("Accord recording worker started.");
  while (!stopped) {
    try {
      const queued = await queuedCaptures();
      for (const capture of queued) {
        if (stopped) break;
        await processCapture(capture.id);
      }
    } catch (error) { console.error("Recording worker could not run", error instanceof Error ? error.name : "Unknown error"); }
    if (!stopped) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
void run();
