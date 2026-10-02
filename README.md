# ccprogress

English | [简体中文](README.zh-CN.md)

A progress bar for long Claude Code sessions. By default the spinner only tells you elapsed time and tokens. ccprogress adds the step the session is on, how many steps are done, and what comes next.

```text
████████████░░░░░░░░░░░░ 3/7 Write the migration
✳ 7m 30s · 123.8k tokens · Running tools…
```

It is a [mod](https://code.claude.com/docs/en/plugins/mods/overview): a plugin whose code runs inside Claude Code. It works in the terminal and in the Code tab of the Claude Desktop app.

## Features

- **Bar above the spinner** while Claude works: done/total steps and the current step. The terminal draws it with block characters, the Desktop app as an SVG bar.
- **Bar above the prompt** while the session is idle, so you can see where the work stopped. A finished plan clears when you send your next prompt.
- **`/progress` pane** with the goal and the full checklist (`✓` done, `▶` running, `○` pending). `/progress clear` resets it.
- **Survives `/resume`**: each session's plan is saved and restored.
- **Quiet transcript**: in the terminal, each progress report folds into one dim line such as `◦ 3/5 Run the tests` instead of the whole step list.
- **Subagents can't take over the bar**: only the main conversation's plan is shown.
- **No network calls and no extra model calls.**

## Where the steps come from

The bar needs someone to say what the steps are. ccprogress picks the first source the session has:

| Source | When it is used |
| --- | --- |
| The built-in `TodoWrite` tool | Builds that offer it. The bar follows the todo list. |
| The built-in task list (`TaskCreate` / `TaskUpdate`) | Builds that offer it. The bar reads the task files under `~/.claude/tasks/<session>/` after each update. |
| Its own `update_progress` tool | Builds without a built-in list, such as the current Desktop app. A short system prompt section asks Claude to report its plan for tasks of three or more steps. |

## Requirements

- Claude Code **v2.1.287** or later. Mods are on by default from that version. Run `claude --version` to check.
- The terminal (`claude`), or the Code tab of the Desktop app (not WSL sessions).
- In the VS Code extension, `claude -p` and the Agent SDK, the hooks still run but nothing is drawn. There, `/progress` prints a text summary.

## Install

```bash
claude plugin marketplace add amigoer/ccprogress
```

```bash
claude plugin install ccprogress@ccprogress
```

Inside a session you can run the same steps as `/plugin marketplace add amigoer/ccprogress` and `/plugin install ccprogress@ccprogress`. Run `/reload-plugins` in sessions that were already open. A plugin installed at user scope loads in both the terminal and the Desktop app.

## Usage

Give Claude a multi-step task. The bar appears once Claude reports the plan and moves as steps finish.

| Command | What it does |
| --- | --- |
| `/progress` | Opens the pane with the full checklist. Works while Claude is busy. |
| `/progress clear` | Clears the current plan. |

## Cost and privacy

- Each progress update is one small tool call, so a task costs a few hundred extra tokens. The system prompt section is about 80 words and is only added when the `update_progress` tool is offered.
- Plans are kept in the plugin's store under `~/.claude/plugins/store/`. Only the 50 most recent sessions are kept.
- The plugin reads files only under `~/.claude/tasks/`, and only when the task list tools run.
- A mod runs with your permissions. Run `claude plugin validate` on the plugin to see every event it hooks and every call it makes before you install it.

## Development

```text
.claude-plugin/marketplace.json      the marketplace this repository serves
plugins/ccprogress/
├── .claude-plugin/plugin.json       the plugin manifest
├── hooks/hooks.json                 points at the hooks module
├── hooks/register.tsx               events, the tool, the command and the drawings
├── hooks/plan.ts                    pure logic: parsing steps, the bar
├── types/index.d.ts                 the $.state contract
└── tests/                           claude plugin test suites
```

Load the plugin from your checkout. It reloads each time you save:

```bash
claude --plugin-dir plugins/ccprogress
```

For the Desktop app, add the absolute path of `plugins/ccprogress` to `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`. Also set `CLAUDE_CODE_PLUGIN_DIR_WATCH` to `1` there to reload on save. Then start a new session.

Check and test:

```bash
claude plugin validate --strict plugins/ccprogress
```

```bash
claude plugin test plugins/ccprogress
```

For editor types, run `/plugin-types` in a session started from the repository root. It writes the declarations to `.claude/types`, which `tsconfig.json` includes. Then type-check:

```bash
npx -p typescript@5 tsc -p .
```

The mods API is still early access and changes between releases. The types `/plugin-types` writes for your build are the reference.

## Disclaimer

This is a community project. It is not affiliated with or endorsed by Anthropic. "Claude" is a trademark of Anthropic, PBC.

## License

[MIT](LICENSE)
