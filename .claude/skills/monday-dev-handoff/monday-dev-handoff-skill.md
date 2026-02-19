---
name: monday-dev-handoff
description: Fetches a Monday.com development ticket by ID, creates a Git worktree + branch via the worktree-devops skill, and hands off a fully-contextualised prompt to a Claude Code sub-agent to begin the task. Automatically moves the ticket to "In Progress" after handoff.
---

# Monday Dev Handoff

You are an orchestration agent that bridges Monday.com ticket management with local Git development workflows. Your job is to take a ticket code from the user, gather all relevant context, prepare the development environment, and hand off a rich brief to a Claude Code sub-agent.

---

## Step 1 — Collect Inputs

Ask the user for:

1. **Ticket code** — the Monday.com item ID or readable code (e.g. `1234567890` or shown in the board URL). If the user already provided it, skip asking.
2. **Repo path** — the absolute path to the local Git repository to work in (e.g. `/Users/alice/projects/my-app`).

Do not proceed until both are confirmed.

---

## Step 2 — Fetch the Monday.com Ticket

Use the Monday.com MCP tools to retrieve the item. You need the following fields:

| Field | Purpose |
|---|---|
| Item name / title | Branch name + agent brief |
| Description / text columns | Core task context for the agent |
| Subtasks / subitems | Acceptance criteria |
| Status column | Confirm ticket is not already "In Progress" or "Done" |
| Priority | Signal urgency to the agent |
| Assignee (People column) | Include in brief for accountability context |
| Any file/asset columns | Pass URLs or references to the agent |

**If the item cannot be found**, tell the user clearly and stop. Do not guess or proceed with incomplete data.

**If the ticket is already "Done" or "In Progress"**, warn the user and ask them to confirm before continuing.

---

## Step 3 — Derive the Branch Name

Construct the branch name as:

```
<ticket-id>-<slugified-title>
```

Rules for slugifying the title:
- Lowercase everything
- Replace spaces and special characters with hyphens (`-`)
- Strip punctuation (apostrophes, commas, slashes, etc.)
- Truncate to 50 characters maximum (after the ID prefix)
- No double hyphens

**Examples:**
- Ticket `1234567890`, title `"Fix login bug on Safari"` → `1234567890-fix-login-bug-on-safari`
- Ticket `9876543210`, title `"Refactor: API layer (v2)"` → `9876543210-refactor-api-layer-v2`

---

## Step 4 — Create the Worktree

Follow the **worktree-devops** skill to:

1. Navigate to the repo root provided by the user.
2. Run `wt new <branch-name>` (or the native `git worktree` fallback if `wt` is not installed).
3. Confirm the worktree was created successfully and note the exact folder path.

If the branch already exists, stop and inform the user — do not overwrite.

---

## Step 5 — Build the Claude Code Prompt

Construct a comprehensive handoff prompt to pass to the Claude Code sub-agent. Use this template:

```
## Task: <Ticket Title>

**Ticket ID**: <ticket-id>
**Priority**: <priority>
**Assignee**: <assignee name(s)>
**Worktree path**: <absolute path to worktree folder>
**Branch**: <branch-name>

---

### Description

<Full ticket description, preserving all detail>

---

### Acceptance Criteria / Subtasks

<List each subitem or acceptance criterion as a checklist item>
- [ ] <subitem 1>
- [ ] <subitem 2>
...

---

### Linked Files & References

<List any file attachments, URLs, or asset references from the ticket>

---

### Instructions

You are working inside the Git worktree at the path above, on branch `<branch-name>`.

1. Read the description and acceptance criteria carefully before writing any code.
2. Complete all acceptance criteria listed above.
3. Keep commits atomic and well-described.
4. Do not modify files outside this worktree.
5. When done, summarise what you changed and which acceptance criteria are satisfied.
```

If any section has no data (e.g. no linked files), omit that section cleanly.

---

## Step 6 — Launch Claude Code

Instruct the user to open Claude Code pointed at the worktree folder, and provide them the full prompt to paste in. Present it in a clearly copyable code block.

If you are able to spawn a sub-agent directly, do so — pass the worktree path as the working directory and the prompt above as the initial message.

---

## Step 7 — Update Monday.com Ticket Status

After the Claude Code handoff is confirmed (either spawned or prompt delivered to user), update the Monday.com item:

- Set the **Status** column to `"In Progress"`

Use the `change_item_column_values` Monday.com tool with the appropriate status column ID. If you are unsure of the column ID, call `get_board_info` first to inspect the board structure.

Confirm to the user that the ticket has been moved to "In Progress".

---

## Summary Output

After completing all steps, give the user a concise summary:

```
✅ Dev handoff complete

Ticket:      <title> (<ticket-id>)
Branch:      <branch-name>
Worktree:    <path>
Status:      Moved to "In Progress"
Agent:       Claude Code launched (or: prompt ready to paste)
```

---

## Error Handling

| Situation | Action |
|---|---|
| Ticket not found | Stop, tell user, ask them to verify the ID |
| Ticket already "In Progress" or "Done" | Warn user, ask for explicit confirmation to continue |
| Branch already exists | Stop, inform user — do not overwrite |
| `wt` not installed | Follow the worktree-devops fallback (native `git worktree`) |
| Status column ID unknown | Call `get_board_info` to discover it before updating |
| Repo path not a git repo | Stop, tell user, ask for correct path |
