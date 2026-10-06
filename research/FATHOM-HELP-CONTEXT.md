# Fathom help-centre context

Read on 6 October 2026.
Source: https://help.fathom.video/en.
Coverage: the seven categories requested by the user and 19 selected articles.
This review covers article text. Linked videos were not watched.
Reading an article does not complete a product test in ASSIGNMENT-CHECKLIST.md.

## Recommendation

Use a focused documentation review, complete the remaining firsthand checks,
then build the scope selected from the 8x brief. The help centre describes the
full commercial product. It does not make every Fathom feature an assignment
requirement. Limit further documentation reading to questions that affect a
product test or a build decision.

## Main findings

### Versions and surfaces

The release log describes the April introduction of the new desktop experience,
June support for Zoom video capture without a bot, and desktop meeting previews.
Its May entry says the General/Enhanced summary replaced chronological templates.
Source: [Release Notes](https://help.fathom.video/en/articles/6220097), edited 2 October 2026.

The upgrade guide describes capture modes, live summaries, a scratch pad,
recording notice, and summaries after calls. Availability can differ by account.
The August roadmap lists desktop search as forthcoming and identifies Zoom
video capture without a bot as already available. Use the user's observed
interface to establish what the account can do now.
Sources: [Upgrade guide](https://help.fathom.video/en/articles/11577345), edited 2 October 2026;
[Fathom 3.0 roadmap](https://help.fathom.video/en/articles/11578049), edited 28 August 2026.

Build implication: keep a record of whether a finding concerns the web app,
the older bot experience, or the new desktop experience. The screenshots show
the new desktop controls. They do not establish the availability of every mode.

### Setup, settings, and capture

The quick-start guide connects Google or Microsoft calendars to upcoming meetings.
The settings article distinguishes capture preferences from sharing preferences.
It also describes automatic task extraction and default summary templates.
Sources: [Quick Start Guide](https://help.fathom.video/en/articles/276608);
[Navigating the Settings Page](https://help.fathom.video/en/articles/3239617).

The adding-meeting article says the new experience detects meetings and offers
capture choices in the tray. The March Zoom article describes another recording
path through Zoom Live Stream. It predates the April desktop redesign.
The real-time FAQ distinguishes live summaries in the new experience from
processing after calls in the older experience. It describes live summaries;
it does not establish word-by-word live transcript output in the user's account.
Sources: [Adding Fathom to a Meeting](https://help.fathom.video/en/articles/449216);
[Zoom Live Stream](https://help.fathom.video/en/articles/295552);
[Real-time transcription FAQ](https://help.fathom.video/en/articles/7573633).

Build implication: provide clear capture, processing, ready, and failed states.
Use the simulated capture option permitted by the brief and label it accurately.

### Summaries and tasks

The summary-customization article describes built-in templates with additional
instructions, regeneration, and applying changes to future summaries.
It says custom instructions are for Premium and Team accounts and are available
in the web app for users of the new experience. Customizing instructions and
selecting another built-in template are separate checks.
Source: [Customizing AI Summaries](https://help.fathom.video/en/articles/3239809).

The June plan comparison says Free accounts retain the General/Enhanced template
after their monthly advanced-summary allowance. A preview can change which
controls are available. Use the actual account to test template switching.
Source: [Free vs. Premium](https://help.fathom.video/en/articles/5290881).

Build implication: preserve important facts when the presentation changes.
Use the same saved task details wherever a task appears. This addresses the
summary/task disagreement found in the screenshot review.

### Highlights and sharing

The highlight articles distinguish in-call highlights in the older experience
from highlights added through the transcript after a call in the new experience.
The latter article describes adjusting the selected range and copying its clip
link. Another article still describes replacement clips as forthcoming.
Check the web app directly and record any unavailable function.
Sources: [Marking Highlights on a Call](https://help.fathom.video/en/articles/295424);
[Adding highlights after a call](https://help.fathom.video/en/articles/295680).

The sharing guide distinguishes full-meeting links from their access settings:
anyone with the link, people on the same domain, or specified people.
The sharing FAQ says recipients can view an appropriately shared recording
without a Fathom account. The account's access settings still matter.
Sources: [Sharing Call Recordings](https://help.fathom.video/en/articles/295616);
[Recipient account FAQ](https://help.fathom.video/en/articles/296128).

Build implication: show the clip start and end, provide a public playback route,
and verify it while signed out. Creating a share link and sending it are
different actions. The later live check verified clip access while signed out.
See FATHOM-LIVE-CHECKS.md.

### Meeting library and search

The call-library article describes loading older meetings and Team visibility.
The account-wide Ask Fathom article describes questions across accessible
meetings. Its 1 October update says this is available across plans and notes
possible Free usage limits from November. This newer article is more relevant
to account-wide access than older general statements that Ask Fathom is paid.
Sources: [Finding calls](https://help.fathom.video/en/articles/7573185);
[Account-Wide Ask Fathom](https://help.fathom.video/en/articles/10390017).

Build implication: distinguish ordinary search from a generated answer across
meetings. The later live check verified web title search and an answer across
both records. Cedar returned no transcript matches in the web library.
The desktop roadmap does not prove ordinary desktop search is available now.

### Integrations and limits

The HubSpot article describes meeting notes, tasks, recording links, and sync
after edits. The Asana article describes syncing tasks assigned to the recording
owner and preserving links to the meeting moment. These explain why correct
owners and consistent task details matter beyond the meeting page.
Sources: [HubSpot Integration](https://help.fathom.video/en/articles/448832);
[Asana Integration](https://help.fathom.video/en/articles/7639617).

The external-recording FAQ says uploaded recordings are not supported.
It was edited in August 2025. Treat an upload flow in our application as a
deliberate addition or simulated capture route, not a documented Fathom feature.
Source: [External recording FAQ](https://help.fathom.video/en/articles/6049729).

Build implication: understand where outputs go, then complete the main meeting
flow before adding CRM or task-manager connections. These integrations are not
established requirements in the supplied brief.

## Firsthand check status

The live product checks are recorded in FATHOM-LIVE-CHECKS.md.

- Completed: a template change, a saved highlight after reload, title search
  across both records, Ask Fathom with a source link, and signed-out clip playback.
- Partial: playback controls and transcript navigation work. Exact audible
  alignment remains unverified. Transcript search across meetings did not find Cedar.
- Open: the eight-person, one-hour case, long-call limits, and an in-call moment
  if the account supports it.

Documentation explains how to attempt a check. It does not replace evidence
from using the product.

## Proposed first build

Prioritize the meeting library, player linked to transcript turns, transcript
search, summary templates, consistent tasks, saved moments, and shared clips.
Add persistent data, clear states, and responsive layouts. Keep the review
improvement after the core flow works. Confirm this scope against the remaining
product observations before application code starts.

Further reading can focus on a specific limit or failed check. Mobile apps,
enterprise administration, billing, and detailed CRM setup can be studied later
if the chosen scope requires them.
