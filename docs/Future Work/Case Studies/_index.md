# Case Studies

Comparative implementations of small applications in STRVCT and conventional stacks.

## Purpose

The naked objects pattern makes strong claims about development efficiency: the framework generates views from models, so developers write less code, and cross-cutting concerns like accessibility and persistence come automatically. These claims are testable.

Each case study would implement the same application in STRVCT and in a conventional React stack (React + React Router + a state library + a component library), built by LLMs under identical conditions. The comparison would measure:

- **Development effort** -- rounds of prompting, debugging iterations, total token usage
- **Code volume** -- lines of code, number of files, boilerplate ratio
- **Correctness** -- bugs found in manual testing, edge cases handled or missed
- **Accessibility** -- ARIA coverage without explicit effort, screen reader usability
- **Persistence and sync** -- how much code is required for local storage and cross-device sync
- **Time to feature** -- how quickly a new feature can be added to the existing app

Multiple LLMs could run the same studies independently to control for model-specific strengths.

## Core Requirements

Every case study app must meet these baseline requirements, because they represent what users expect from a real, useful application:

- **Local persistence** -- data survives page refresh and browser restart
- **Cloud sync** -- data is available across devices via authenticated user accounts
- **Accessibility** -- correct ARIA roles, labels, and states on all interactive elements; keyboard-navigable
- **Drag-to-reorder** -- lists that have a user-meaningful order support drag reordering

These features are often omitted from small apps not because users don't want them, but because the tools make them expensive to implement. A fair comparison should include them precisely because they reveal where framework design choices reduce or increase the cost of building what users actually need.

## Candidate Applications

Each app is small enough to build in a single session but non-trivial enough to exercise real framework features: persistence, cloud sync, navigation, editing, validation, and multiple data types.

### 1. Contacts

A personal contacts manager. Each contact has structured fields (name, phone numbers, email addresses, physical address, birthday, notes) with the ability to add multiple entries per field type. Contacts are grouped, searchable, and persisted with cross-device sync. Exercises: nested data structures, multiple field types, search/filtering, persistence, list navigation.

### 2. Photo Gallery

A personal photo gallery with albums containing images. Users upload images (with drag-and-drop), which are stored as blobs with generated thumbnails. Each image has a caption, tags, and date taken. Albums display as a grid of thumbnails; selecting an image opens a detail view. Images are drag-reorderable within albums. Supports bulk upload. Exercises: binary blob storage and retrieval, image upload and thumbnail generation, grid layout, lazy loading, media-heavy UI, drag-to-reorder in a grid context, tagging and filtering.

### 3. Project Tracker

A lightweight project management tool with projects containing tasks. Each task has a title, description, status (todo/in-progress/done), priority, due date, and assignee. Tasks can be drag-reordered within status groups. Exercises: enum fields (status, priority), date handling, drag-to-reorder, grouping/filtering by property, multiple navigation levels (project → task list → task detail).

### 4. Discussion Forum

A multi-user discussion forum with boards, threads, and posts. Users create accounts, post in threads, and see content from other users in real time. Thread authors can edit or delete their own posts; board-level moderation controls allow designated admins to remove content. Threads sort by latest activity; posts are chronological within a thread. Posts support basic formatting (markdown or simple HTML). Exercises: shared mutable state across users, authentication and per-user permissions, real-time updates from other users, threading/nesting, rich text input, moderation controls.

### 5. Knowledge Base

A personal wiki for organizing notes, ideas, and reference material. Each entry has a title, rich text body (headings, bold, italic, lists, code blocks), tags, and creation/modification timestamps. Entries can link to other entries via wiki-style cross-references (`[[Entry Title]]`), forming a navigable graph. A backlinks section on each entry shows all entries that reference it. Full-text search across all entries. Exercises: rich text editing, cross-referencing and link resolution, backlink computation, tagging, full-text search, deep content hierarchy.

### 6. Bookmark Manager


A hierarchical bookmark organizer with folders, tags, and full-text search. Each bookmark has a URL, title, description, tags, and a timestamp. Folders can nest arbitrarily. Bookmarks are drag-reorderable within folders. Supports import from a simple format. Exercises: recursive hierarchy (nested folders), tagging system, full-text search, URL validation, drag-to-reorder, bulk import, deep navigation.

## Study Design

### Environment

Each implementation starts from the same written specification. The LLM receives the app spec and the relevant framework documentation (STRVCT docs or React/library docs) and builds the app through iterative prompting. No human code review or correction during the build -- the LLM debugs its own errors.

### Metrics

| Metric | What it measures |
|---|---|
| Prompt rounds | Number of user→LLM turns to reach a working app |
| Debug iterations | Turns spent fixing errors vs. building new features |
| Token usage | Total input + output tokens consumed |
| Lines of code | Final app size excluding framework/library code |
| File count | Number of source files in the final app |
| ARIA coverage | Percentage of interactive elements with correct ARIA roles and states |
| Persistence + sync code | Lines dedicated to storage and cloud sync (annotations vs. explicit read/write) |
| Feature addition | Effort to add a specified new feature after initial completion |

### Controls

- Same app spec, same acceptance criteria
- Same LLM model (or multiple models run independently)
- React stack chosen to be representative, not strawman: current React with hooks, a mainstream router, and a widely-used component library
- React implementations may use any third-party libraries (drag-and-drop, Firebase SDK, accessibility utilities) -- the total effort including library integration is part of the measurement
- Each app tested against the same manual test checklist
