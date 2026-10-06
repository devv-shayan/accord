---
name: app-designer
description: >
  Design and improve web app interfaces with a clear visual direction and
  polished, responsive browser screens. Use for web app design, web UI,
  dashboards, browser-based products, or redesigns of existing web apps.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent
---

# App Designer

Use this skill for web apps and browser-based products. Follow the design
process in this file. Use the project's existing web stack and preview tools
when they are available. Do not use iPhone frames, iOS patterns, SwiftUI, or
App Store steps for web app work.

AI slop is not ugly. It is **average**: every decision left at the most likely
value. Cream and terracotta because the app is calm. Lime on black because it
is money. Inter because it is a UI. "Good morning, Maya" because it is a home
screen. Each choice is defensible, and together they make an app nobody can
tell apart from the last hundred.

Award-winning apps make a few specific, defended decisions and execute them
with craft. This process helps make those decisions and check them in the
browser.

**What you produce:** `DIRECTION.md` (brief, concept, tokens and content), a
three-direction exploration, responsive web screens, a visual quality check,
and a short report. Use the project's real framework for implementation.

## References

Read each reference when its step needs it:

| File | Read before |
|---|---|
| [slop.md](references/slop.md) | Step 1 |
| [directions.md](references/directions.md) | Step 2 |
| [type.md](references/type.md), [color.md](references/color.md) | Step 2 and Step 4 |
| [copy.md](references/copy.md) | Step 3 |
| [imagery.md](references/imagery.md) | Step 2 and Step 4 |
| [motion.md](references/motion.md) | Step 2 and Step 4 |

## Step 0: Understand the brief

Ask in one short message if key details are missing:

1. What does the web app do, and who uses it?
2. What is the main action a user needs to take?
3. What should the interface feel like? Ask for up to three references outside
   apps, such as a magazine, shop, object, film, or place.
4. What already exists: name, brand, code, content, images, or user feedback?
5. Which pages or states need work? Ask for a link or screenshots for a
   redesign.
6. May you use image generation if it uses the user's credits?

Do not ask again for information the user already gave. If the user says to
proceed, make a reasonable brief and mark it **self-authored**. Do not spend
paid credits without permission.

Create a working folder and put the brief at the top of `DIRECTION.md`.

### Redesigns

Before Step 1, add a `## Current app` section to `DIRECTION.md`:

1. Review the existing app in a browser. Record important issues and user
   feedback.
2. List what to keep, remove, and confirm. Keep all required features and
   useful content in the new design.
3. Reuse good assets from the project. Do not replace a logo, image, or brand
   system without a reason.
4. List major changes to navigation, names, or features. Do not make them
   silently.
5. Include a before-and-after view when it helps explain the redesign.

## Step 1: Know the traps

Read [slop.md](references/slop.md), including its section on overcorrection.
Avoid a result that is only grey, plain text, and rules. The interface needs
visual richness that fits the product.

If the user has a design history file, read it. Do not repeat the same visual
direction without a clear reason.

## Step 2: Explore visual directions

Read [directions.md](references/directions.md) and [imagery.md](references/imagery.md).

1. Check which real images, illustrations, or brand assets are available.
   Do not promise assets that you cannot provide.
2. Write three short concepts for the product. Each must use a different
   visual source, such as print, objects, places, media, nature, or play.
3. Make three versions of the main web page with real content. Use the
   project's stack when practical. Otherwise, create a simple HTML exploration.
   Give each version a different visual direction, type, and use of colour or
   imagery.
4. Preview all three in a browser at desktop and mobile widths. Choose one.
   Record why it fits the product and why the other two do not. A safe, generic
   choice is not the goal.
5. Add the selected direction to `DIRECTION.md` with its colour roles, type,
   spacing, image style, and a signature interaction.

If the user can review the work, show the exploration and explain your choice
before full implementation.

## Step 3: Write the content

Read [copy.md](references/copy.md). Write the real page content in
`DIRECTION.md` before layout work. Include useful labels, values, names,
dates, and image subjects. Use believable data and realistic page states.

## Step 4: Design the web app

Use the project's existing framework, components, and coding style. Keep the
work focused on the pages and states in the brief. If the request is only for
visual concepts, keep them as a separate exploration.

Design the main page and the pages needed for the core user task. Include
loading, empty, error, and success states when they matter. Make the layouts
work at common mobile, tablet, and desktop widths. Use responsive CSS layout
such as flexbox and grid. Avoid fixed page coordinates except for overlays
that need them.

Design rules:

1. Give each page one clear visual focus.
2. Put the key content and actions where users can find them quickly.
3. Use type size, weight, and spacing to show importance.
4. Use colour with clear roles. Check contrast for text and controls.
5. Use real images, illustration, shape, or material where it supports the
   visual direction.
6. Make interactive states clear. Show hover, focus, disabled, and selected
   states when the interface needs them.
7. Make keyboard use and visible focus work. Use semantic HTML and accessible
   names for controls.
8. Avoid emoji icons, fake content, broken image links, and decoration with no
   purpose.

## Step 5: Preview and review

Run the project using its documented development workflow. Open the result in
a browser and review it at mobile, tablet, and desktop widths. Use available
screenshots or browser tools to inspect the actual rendered page.

Check for clipped or overlapping content, horizontal scrolling, weak contrast,
small controls, inconsistent spacing, missing focus states, broken images, and
unclear page hierarchy. Check important interactions with mouse and keyboard.
Fix visible defects before reporting the work. Use the project's checks when
they cover changed code.

When a fresh reviewer is available, ask them to review the rendered pages for:
visual identity, clear hierarchy, readable type, colour and contrast,
responsive layout, accessibility, useful interactions, and fit to the brief.
Ask for specific page and element changes. Do not let a reviewer restore a
default style that the brief rejects.

## Step 6: Iterate

Make a new preview after each meaningful change. Compare it with the last
review. Fix important defects and report any item you could not verify. Keep
the number of review rounds useful for the task; do not polish beyond the
user's need.

## Report

State the chosen direction, pages and states changed, responsive checks,
review findings, and any limits. For a redesign, include the before-and-after
view when available, the features kept, and decisions that need the user's
input. Do not claim that a check passed if you did not run it.
