import type { TranscriptSegment } from "@/lib/types";

export interface TranscriptTurn {
  id: string;
  speakerLabel: string;
  segments: TranscriptSegment[];
}

// Keep each source segment and time anchor. Only combine consecutive short turns for display.
export function groupTranscript(segments: TranscriptSegment[]): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  let characters = 0;
  for (const segment of segments) {
    const turn = turns[turns.length - 1];
    const previous = turn?.segments[turn.segments.length - 1];
    const first = turn?.segments[0];
    const gap = segment.startSeconds !== null && previous?.endSeconds !== null && previous?.endSeconds !== undefined
      ? segment.startSeconds - previous.endSeconds : Infinity;
    const span = segment.endSeconds !== null && first?.startSeconds !== null && first?.startSeconds !== undefined
      ? segment.endSeconds - first.startSeconds : Infinity;
    if (turn && previous && segment.speakerLabel === previous.speakerLabel && segment.speakerId === previous.speakerId &&
      gap >= 0 && gap <= 1.2 && span <= 35 && characters + segment.text.length <= 650) {
      turn.segments.push(segment);
      characters += segment.text.length + 1;
    } else {
      turns.push({ id: segment.id, speakerLabel: segment.speakerLabel, segments: [segment] });
      characters = segment.text.length;
    }
  }
  return turns;
}

export function transcriptText(segments: TranscriptSegment[], formatTime: (seconds: number) => string) {
  return segments.map((segment) =>
    `[${segment.startSeconds === null ? "--:--" : formatTime(segment.startSeconds)}] ${segment.speakerLabel}\n${segment.text}`
  ).join("\n\n");
}
