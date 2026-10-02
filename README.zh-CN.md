# ccprogress

[English](README.md) | 简体中文

给 Claude Code 长会话加一个进度条。默认的 spinner 只显示耗时和 token 数，ccprogress 把“现在做到哪一步、完成了几步、下一步是什么”补上。

```text
████████████░░░░░░░░░░░░ 3/7 编写数据迁移
✳ 7m 30s · 123.8k tokens · Running tools…
```

它是一个 [mod](https://code.claude.com/docs/en/plugins/mods/overview)，也就是一种代码在 Claude Code 内部运行的插件，同时支持终端和 Claude Desktop 的 Code 标签页。

## 功能

- **spinner 上方的进度条**：Claude 干活时显示已完成步数/总步数和当前步骤。终端里用方块字符画，Desktop 里画成 SVG 进度条。
- **空闲时显示在输入框上方**：方便看清停在了哪一步。计划全部完成后，下一次发消息时自动清除。
- **`/progress` 面板**：显示目标和完整步骤清单（`✓` 已完成，`▶` 进行中，`○` 未开始）。`/progress clear` 用来清空。
- **`/resume` 后自动恢复**：每个会话的计划都会单独保存。
- **子代理不会覆盖进度条**：只显示主对话的计划。
- **不联网，也不额外调用模型。**

## 步骤数据从哪来

进度条得有人告诉它有哪些步骤。ccprogress 会按顺序取当前会话里第一个可用的来源：

| 来源 | 什么时候用 |
| --- | --- |
| 内置 `TodoWrite` 工具 | 提供该工具的版本，进度条跟随 todo 列表。 |
| 内置任务列表（`TaskCreate` / `TaskUpdate`） | 提供这些工具的版本，每次更新后读取 `~/.claude/tasks/<session>/` 下的任务文件。 |
| 插件自带的 `update_progress` 工具 | 没有内置列表的版本，比如目前的 Desktop。插件会在系统提示里加一小段说明，请 Claude 在三步及以上的任务里上报计划。 |

## 环境要求

- Claude Code **v2.1.287** 或更高。从这个版本起 mod 默认开启，可以用 `claude --version` 查看。
- 终端（`claude`），或 Desktop 的 Code 标签页（WSL 会话除外）。
- 在 VS Code 插件、`claude -p` 和 Agent SDK 里，hook 照常运行但不会画界面，这时 `/progress` 会改为输出文字摘要。

## 安装

```bash
claude plugin marketplace add amigoer/ccprogress
```

```bash
claude plugin install ccprogress@ccprogress
```

也可以在会话里执行 `/plugin marketplace add amigoer/ccprogress` 和 `/plugin install ccprogress@ccprogress`。已经打开的会话需要执行一次 `/reload-plugins`。装在用户级别的插件，终端和 Desktop 都会加载。

## 使用

给 Claude 一个多步骤的任务。Claude 上报计划后进度条就会出现，并随着步骤完成往前走。

| 命令 | 作用 |
| --- | --- |
| `/progress` | 打开步骤清单面板，Claude 干活时也能用。 |
| `/progress clear` | 清空当前计划。 |

## 开销与隐私

- 每次更新进度是一次很小的工具调用，一个任务大约多花几百 token。系统提示里的那段说明大约 80 个英文单词，而且只在 `update_progress` 工具可用时才会加上。
- 计划保存在 `~/.claude/plugins/store/` 下的插件存储里，只保留最近 50 个会话。
- 插件只读取 `~/.claude/tasks/` 下的文件，而且只在任务列表工具运行时读。
- mod 以你的权限运行。安装前可以对插件执行 `claude plugin validate`，查看它挂了哪些事件、调用了哪些 API。

## 开发

```text
.claude-plugin/marketplace.json      本仓库对外提供的 marketplace
plugins/ccprogress/
├── .claude-plugin/plugin.json       插件清单
├── hooks/hooks.json                 指向 hooks 模块
├── hooks/register.tsx               事件、工具、命令和界面绘制
├── hooks/plan.ts                    纯逻辑：步骤解析、进度条
├── types/index.d.ts                 $.state 的类型约定
└── tests/                           claude plugin test 测试
```

从本地仓库加载插件，保存文件后会自动重载：

```bash
claude --plugin-dir plugins/ccprogress
```

在 Desktop 里调试：把 `plugins/ccprogress` 的绝对路径加到 `~/.claude/settings.json` 的 `env` 里的 `CLAUDE_CODE_PLUGIN_DIRS`。想要保存即重载，就在同一处再设置 `CLAUDE_CODE_PLUGIN_DIR_WATCH` 为 `1`。然后新开一个会话。

校验和测试：

```bash
claude plugin validate --strict plugins/ccprogress
```

```bash
claude plugin test plugins/ccprogress
```

想在编辑器里得到类型提示，就在仓库根目录启动的会话里执行 `/plugin-types`，它会把类型声明写到 `.claude/types`（`tsconfig.json` 已经包含这个目录）。然后做类型检查：

```bash
npx -p typescript@5 tsc -p .
```

mods API 目前还是 early access，不同版本之间会有变化，以 `/plugin-types` 为你的版本生成的类型为准。

## 声明

这是一个社区项目，与 Anthropic 没有关联，也没有得到 Anthropic 的背书。“Claude” 是 Anthropic, PBC 的商标。

## 许可证

[MIT](LICENSE)
