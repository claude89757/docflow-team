# Phase 0 技术调研: Agent Teams via Claude Agent SDK

**日期:** 2026-03-29
**结论:** 使用 Agent Teams（通过 Claude Agent SDK 启用）作为编排层

---

## 为什么是 Agent Teams，不是 Subagents

管线不是严格顺序的。审核循环是动态的：

```
[内容生成器] → 初稿
      ↓
[内容编辑] ←──────────────────┐
      ↓                       │ "段落3的AI味还重，返工"
[格式设计师] ←─────────┐      │
      ↓                │      │
[质量审核员] ───────────┴──────┘
      ↓                 横向消息
  分数 ≥ 8? → 完成
```

Subagent 模式：父 agent 调用子 agent，子 agent 跑完就销毁。reviewer 要踢回给 editor，必须经过父 agent 转发。父 agent 变成瓶颈，每轮循环都要重新编排。

Agent Teams 模式：reviewer 直接 message editor："段落3返工"。editor 改完 message 回 reviewer。横向对话，不经过中间人。Team Lead 只管启动和收尾。

| 能力 | Subagents | Agent Teams |
|------|-----------|-------------|
| 顺序执行 | 父 agent 逐个调用 | 任务依赖自动排序 |
| 动态循环 | 父 agent 手动编排每轮 | Reviewer → Editor 直接消息 |
| 横向通信 | 不支持（只能上报给父） | Teammate 互发消息 |
| 并行工作 | 支持（多个 subagent 并发） | 支持（多个 teammate 并发） |
| 共享状态 | 文件系统 + prompt 传递 | 共享任务列表 + 消息邮箱 + 文件系统 |
| 上下文隔离 | 每次调用独立上下文 | 每个 teammate 独立上下文 |
| 生命周期 | 调用完即销毁 | 持续存活，可接收新消息 |

**动态循环是决定性差异。** Agent Teams 的 teammate 持续存活，reviewer 可以反复和 editor 对话直到质量达标，不需要每轮重建上下文。

---

## 三条路径总结

| 路径 | 角色 | 状态 |
|------|------|------|
| **Agent Teams** | 编排层核心（teammate 横向协作 + 动态循环） | 实验性 (需 env flag), v2.1.32+ |
| **Claude Agent SDK** | 编程接口（从 FastAPI 启动和控制 Agent Teams） | Alpha (v0.1.51), 文档完整 |
| **CLI `-p` 模式** | 不直接使用（SDK 底层已封装） | GA |

Agent SDK 是 Agent Teams 的编程入口。不是二选一，是一起用。

---

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│                                                          │
│  HTTP/WS ────── api/routes/                              │
│                    ├── upload.py                          │
│                    ├── generate.py                        │
│                    └── ws.py (WebSocket)                  │
│                                                          │
│  services/orchestrator/pipeline.py                        │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Claude Agent SDK                                 │    │
│  │  env: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1      │    │
│  │                                                   │    │
│  │  Team Lead (编排者)                               │    │
│  │    ├── 创建任务、分配角色                          │    │
│  │    ├── 监控整体进度                                │    │
│  │    └── 收集最终结果                                │    │
│  │                                                   │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ Teammates (持续存活，横向通信)               │  │    │
│  │  │                                             │  │    │
│  │  │  [内容生成器] ──msg──→ [内容编辑]           │  │    │
│  │  │                          │                  │  │    │
│  │  │                        msg                  │  │    │
│  │  │                          ↓                  │  │    │
│  │  │                     [格式设计师]             │  │    │
│  │  │                          │                  │  │    │
│  │  │                        msg                  │  │    │
│  │  │                          ↓                  │  │    │
│  │  │                     [质量审核员]             │  │    │
│  │  │                       ↗    │                │  │    │
│  │  │            "返工"   ╱      │ "通过"         │  │    │
│  │  │  [内容编辑] ←──────╱       ↓                │  │    │
│  │  │                        完成                  │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                   │    │
│  │  Hooks: TeammateIdle / TaskCreated / TaskCompleted │    │
│  │       │                                           │    │
│  │       └──→ WebSocket 推送                         │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Teams 核心机制

基于调研，Agent Teams 提供：

| 机制 | 用途 | docflow 对应 |
|------|------|-------------|
| **共享任务列表** | 任务创建/认领/依赖追踪 | 管线各步骤作为 task，依赖自动排序 |
| **消息邮箱** | teammate 互发消息（message/broadcast） | reviewer → editor 返工指令 |
| **Plan 审批门** | teammate 先出方案，lead 批准后执行 | 可选：editor 先出修改方案，lead 确认后应用 |
| **Hooks** | TeammateIdle / TaskCreated / TaskCompleted | 状态变更 → WebSocket 推送到前端 |
| **文件锁定** | 防止多 teammate 同时写同一文件 | 文档文件并发安全 |

### 团队配置

```python
# Team Lead 启动 Agent Teams
options = ClaudeAgentOptions(
    env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
    setting_sources=["project"],
    include_partial_messages=True,
)
```

### 角色定义 (`.claude/agents/`)

```
.claude/agents/
  ├── content-generator.md    # 内容生成器
  ├── content-editor.md       # 内容编辑（去AI味 + 文风DNA）
  ├── format-designer.md      # 格式设计师
  └── quality-reviewer.md     # 质量审核员
```

每个 agent 文件示例 (`content-editor.md`):

```markdown
---
description: 改写 AI 味文字，注入用户文风 DNA
tools: ["Read", "Write", "mcp__docflow-tools__*"]
model: sonnet
---

你是内容编辑。你的职责：
1. 接收文档路径（通过消息或任务）
2. 读取文档内容
3. 按照中文去 AI 味 checklist 改写
4. 如有文风 DNA，注入个人风格
5. 改完后消息通知格式设计师
6. 如收到审核员的返工指令，定向修改指定段落

返工时只改审核员标记的位置，不要重做全文。
```

### 动态循环流程

```python
async def run_pipeline(task_id: str, doc_path: str, ws_manager):
    """
    Team Lead 的 prompt 描述完整管线逻辑。
    Teammates 按任务依赖执行，reviewer 可触发返工循环。
    """

    lead_prompt = f"""
    你是文档精修团队的 Team Lead。处理文档: {doc_path}

    创建以下任务并分配给对应 teammate:

    Task 1: [content-generator] 根据需求生成文档初稿 → 写入 {doc_path}
    Task 2: [content-editor] 去 AI 味 + 注入文风 DNA (blocked by Task 1)
    Task 3: [format-designer] 排版人类化 (blocked by Task 2)
    Task 4: [quality-reviewer] 盲审 + 打分 (blocked by Task 3)

    审核循环规则:
    - 如果 quality-reviewer 评分 < 8/10，quality-reviewer 直接消息
      content-editor 和 format-designer 说明返工要求
    - content-editor 和 format-designer 收到返工消息后修改，
      改完消息通知 quality-reviewer 重审
    - 最多 3 轮循环。3 轮后输出当前最佳版本

    每个 teammate 完成任务时，你在 lead 层记录：
    - 哪个 agent 完成了什么
    - 修改了哪些内容（agent 应在消息中汇报）
    - 质量评分结果
    """

    # Hooks 拦截事件 → WebSocket 推送
    async def on_task_created(input_data, tool_use_id, context):
        await ws_manager.send(task_id, {
            "type": "agent_status",
            "agent": input_data.get("assignee", "unknown"),
            "status": "pending",
            "task": input_data.get("subject", ""),
        })
        return {}

    async def on_task_completed(input_data, tool_use_id, context):
        await ws_manager.send(task_id, {
            "type": "agent_status",
            "agent": input_data.get("assignee", "unknown"),
            "status": "completed",
            "task": input_data.get("subject", ""),
        })
        return {}

    async def on_teammate_idle(input_data, tool_use_id, context):
        # Teammate 完成当前工作，等待新消息
        await ws_manager.send(task_id, {
            "type": "agent_status",
            "agent": input_data.get("teammate_id", "unknown"),
            "status": "idle",
        })
        return {}

    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        hooks={
            "TaskCreated": [HookMatcher(hooks=[on_task_created])],
            "TaskCompleted": [HookMatcher(hooks=[on_task_completed])],
            "TeammateIdle": [HookMatcher(hooks=[on_teammate_idle])],
        },
        include_partial_messages=True,
        allowed_tools=["Read", "Write", "Agent", "TaskCreate", "TaskUpdate",
                       "SendMessage", "mcp__docflow-tools__*"],
        mcp_servers={
            "docflow-tools": doc_tools_server,
        },
    )

    # 必须用 ClaudeSDKClient (hooks 需要 client 模式, query() 不触发 hooks)
    async with ClaudeSDKClient(options=options) as client:
        await client.query(lead_prompt)
        async for message in client.receive_response():
            if isinstance(message, StreamEvent):
                event = message.event
                await ws_manager.send(task_id, {
                    "type": "stream",
                    "event": _extract_ws_event(event),
                })
            elif isinstance(message, ResultMessage):
                await ws_manager.send(task_id, {
                    "type": "pipeline_complete",
                    "result": message.result,
                })
```

### 自定义工具（不变）

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool("parse_docx", "解析 Word 文档结构", {"file_path": str})
async def parse_docx(args):
    from processors.docx_processor import DocxProcessor
    processor = DocxProcessor()
    result = processor.parse(args["file_path"])
    return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]}

@tool("apply_format_changes", "执行格式修改指令", {"file_path": str, "changes": list})
async def apply_format_changes(args):
    from processors.docx_processor import DocxProcessor
    processor = DocxProcessor()
    processor.apply_changes(args["file_path"], args["changes"])
    return {"content": [{"type": "text", "text": "格式修改已应用"}]}

@tool("score_document", "质量评分", {"file_path": str, "original_path": str})
async def score_document(args):
    """审核员用此工具获取结构化评分数据"""
    # 对比原文和精修版，生成评分维度数据
    return {"content": [{"type": "text", "text": json.dumps({
        "词汇自然度": 0, "句式多样性": 0, "格式人类感": 0,
        "逻辑连贯性": 0, "领域适配度": 0,
    }, ensure_ascii=False)}]}

doc_tools_server = create_sdk_mcp_server(
    name="docflow-tools", version="1.0.0",
    tools=[parse_docx, apply_format_changes, score_document],
)
```

---

## WebSocket 消息协议 (前端消费)

```typescript
// 前端接收的 WebSocket 消息类型
type WSMessage =
  | { type: "agent_status"; agent: string; status: "pending" | "working" | "idle" | "completed"; task?: string }
  | { type: "agent_message"; from: string; to: string; content: string }  // teammate 间消息
  | { type: "rework_cycle"; round: number; max: 3; reviewer_notes: string }
  | { type: "score_update"; scores: Record<string, number>; total: number; pass: boolean }
  | { type: "diff"; agent: string; changes: DiffEntry[] }
  | { type: "pipeline_complete"; result: string }
  | { type: "stream"; event: any }
```

前端可视化面板直接消费这些消息：
- `agent_status` → 更新 agent 状态指示灯
- `agent_message` → 展示 teammate 间的对话（用户可以"偷听"团队协作）
- `rework_cycle` → 显示返工轮次 + 审核员意见
- `score_update` → 渲染雷达图
- `diff` → 展示修改对比

**"偷听团队协作"是产品差异化的关键。** 用户看到的不是黑盒出结果，而是一个团队在讨论他的文档怎么改。

---

## 止损机制 (Fallback)

Agent Teams 是实验性功能。如果遇到阻塞性问题：

| 层级 | 先试 | 降级到 |
|------|------|--------|
| L1: Teams bug | Agent Teams | Agent SDK subagents (顺序调用，父 agent 编排循环) |
| L2: SDK bug | Agent SDK subagents | Anthropic Client SDK + 自建 asyncio 编排器 |
| L3: API bug | 所有 SDK | 直接 HTTP 调 Claude API |

**L1 降级代价：** 失去横向通信，循环由父 agent 转发。前端可视化降级为"每轮批量更新"而非"实时对话"。可接受。

**L2 降级代价：** 失去 hook 系统，手动在每次 API 调用前后推 WebSocket。更多胶水代码。可接受。

### Fallback 触发条件

- Agent Teams 环境变量无效或启动失败
- Teammate 消息丢失率 > 5%（对话断裂）
- 循环无法正常终止（3 轮后仍在跑）
- Hook 回调延迟 > 5s

---

## POC 验证结果 (2026-03-29)

**全部 6 个验证点通过。** Agent Teams 方案确认可行。

| # | 验证 | 结果 | 关键发现 |
|---|------|------|---------|
| 1 | SDK + Teams 启动 | **PASS** | `query("回复一个字: OK")` → 3 条消息，返回 "OK" |
| 2 | Teammate 创建 + 任务分配 | **PASS** | Lead 创建 writer + reviewer，54 条消息，6 次 SendMessage |
| 3 | Teammate 横向消息 | **PASS** | editor 直接消息 reviewer，83 条消息，5 次 SendMessage |
| 4 | 动态循环 | **PASS** | TeamCreate → editor ↔ reviewer 自主通信 → TeamDelete，Lead 未介入 |
| 5 | Hooks → WebSocket | **PASS** | 4 个 hook 事件捕获：PreToolUse, SubagentStart, SubagentStop, PostToolUse |
| 6 | 自定义工具 | **PASS** | 2 个 @tool 工具被 agent 调用：analyze_document + get_style_dna |

### 关键技术发现

1. **Hooks 必须用 `ClaudeSDKClient`，不能用 `query()`**
   - `query()` 支持 agents 和自定义工具，但 hooks 不触发
   - 后端编排层必须基于 `ClaudeSDKClient` 实现

2. **Agent Teams 通信模式确认**
   - `TeamCreate` 创建团队 → `Agent` 启动 teammate → `SendMessage` 横向通信 → `TeamDelete` 清理
   - Teammate 间自主通信，Team Lead 不需要介入每轮对话

3. **自定义工具 via `@tool` + `create_sdk_mcp_server` 开箱即用**
   - In-process MCP server，不需要外部进程
   - 工具名格式: `mcp__docflow-tools__analyze_document`

4. **环境配置**
   - Claude Code v2.1.86 (远超 v2.1.32 要求)
   - `claude-agent-sdk==0.1.51`
   - 支持自定义 `ANTHROPIC_BASE_URL` 代理

### 管线代码骨架修正

基于 POC #5 发现，编排层必须使用 `ClaudeSDKClient`：

```python
async def run_pipeline(task_id: str, doc_path: str, ws_manager):
    options = ClaudeAgentOptions(
        env={"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
        agents=AGENTS,
        hooks={
            "SubagentStart": [HookMatcher(hooks=[on_subagent_start])],
            "SubagentStop": [HookMatcher(hooks=[on_subagent_stop])],
            "PreToolUse": [HookMatcher(hooks=[on_pre_tool])],
            "PostToolUse": [HookMatcher(hooks=[on_post_tool])],
        },
        mcp_servers={"docflow-tools": doc_tools_server},
        include_partial_messages=True,
    )

    # 必须用 ClaudeSDKClient, 不能用 query()
    async with ClaudeSDKClient(options=options) as client:
        await client.query(lead_prompt)
        async for message in client.receive_response():
            # hooks 自动触发 → ws_manager.send()
            if hasattr(message, "result") and message.result:
                await ws_manager.send(task_id, {
                    "type": "pipeline_complete",
                    "result": message.result,
                })
```

---

## 下一步

Phase 0 完成。进入 Phase 1: Web 框架 + 单格式管线。

1. FastAPI WebSocket 端点 + 前端 React 骨架
2. 文档上传 + docx 解析 (python-docx)
3. 4 agent 管线 (generator → editor → formatter → reviewer) 接真实文档
4. WebSocket 实时推送 agent 状态到前端
