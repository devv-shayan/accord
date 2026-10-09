# Long meeting reference notes

Date: 6 October 2026.
Reference: public ICSI Meeting Corpus record Bmr007.

This file records rebuild requirements from the public long-meeting data. It
does not describe Fathom behavior. No eight-person, one-hour Fathom record was
available in the tested account.

## Data shape

- Duration: 3,603.395 seconds, about 60 minutes and 3.4 seconds.
- Speakers: 8.
- Timed transcript segments: 2,557.
- Segments without an assigned speaker: 4.
- Time covered by overlapping speaker annotations: 649.422 seconds.
- Peak simultaneous annotated speakers: 8.

The first transcript entries already show the navigation problem: several
speakers can start at the same timestamp and short fragments can overlap. A
single active transcript row is therefore not enough to represent every moment.

## Rebuild requirements

1. Do not render all 2,557 rows as one large static transcript. Use windowing or
   another bounded rendering strategy so search and playback stay responsive.
2. Keep every segment's start and end time. Seeking must use time, not row index.
3. Support speaker filtering without changing source timestamps.
4. Search results must link to the exact matching segment and seek position.
5. Overlapping turns must remain separate records. Do not merge speakers only
   because their times intersect.
6. Playback highlighting must allow more than one transcript segment to be
   active when time ranges overlap.
7. Long-call navigation needs coarse jumps as well as transcript search. A user
   should be able to move by time without scrolling through thousands of rows.
8. Small fragments and nonverbal events should not dominate the visual layout.
   They can stay in the source record while the UI keeps the main speech readable.

## Limit

These findings prove that the rebuild has a realistic long and overlapping
meeting case to test. They do not prove how Fathom performs on the same case.
That live product check remains unavailable and is reported as such.
