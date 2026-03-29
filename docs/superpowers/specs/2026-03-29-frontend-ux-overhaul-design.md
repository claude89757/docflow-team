# DocFlow 前端交互设计全面改造

**日期**: 2026-03-29
**范围**: 前端 UI/UX 全面改造 + 后端 Usage 追踪 API

---

## 1. 视觉系统基底

### 设计语言：macOS Sonoma Light Glassmorphism

**背景**
- 页面底色 `#f5f5f7`
- 2-3 个极淡色斑，`filter: blur(50-60px)`，颜色对应 Agent 主色（紫/蓝/绿）

**毛玻璃面板**
- `background: rgba(255,255,255, 0.6-0.7)`
- `backdrop-filter: blur(20-30px)`
- `border: 0.5px solid rgba(0,0,0, 0.04)`
- `border-radius: 12px`

**字体**
- `-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif`
- 沿用系统字体栈，不引入外部字体

**色彩体系**
- 主色调：系统蓝 `#007aff`（CTA、链接、活跃状态）
- Agent 四色：
  - 🤖 小创（生成器）：紫 `#5e5ce6`
  - ✍️ 小修（编辑）：蓝 `#007aff`
  - 🎨 小美（设计师）：橙 `#ff9f0a`
  - 🧐 小审（评审）：绿 `#30d158`
- 语义色：成功 `#34c759`、警告 `#ff9f0a`、错误 `#ff3b30`
- 文本三级灰度：`rgba(0,0,0, 0.85/0.5/0.35)`

**按钮**
- 主按钮：系统蓝胶囊 `border-radius: 980px`，白色文字
- 次按钮：毛玻璃底 + 蓝色描边

**动效**
- 保留现有 6 个动画（glow-pulse, dot-pulse, slide-up, fade-in, bar-fill, check-pop）
- 新增 `fade-blur-in`：毛玻璃面板入场（从模糊到清晰）

**实施方式**
- 创建 `theme.css`，用 CSS 变量统一定义颜色、圆角、模糊度、阴影
- 抽取 `GlassCard` 通用 React 组件（毛玻璃面板）
- 所有现有组件迁移到新主题

---

## 2. Agent 形象系统

### 风格：Emoji 人设型

每个 Agent 有固定的 Emoji 头像、昵称、主色和浅色底：

| Agent | Emoji | 昵称 | 角色 | 主色 | 头像底色 |
|-------|-------|------|------|------|---------|
| content-generator | 🤖 | 小创 | 内容生成 | `#5e5ce6` | `linear-gradient(180deg, #f0edff, #e0dbff)` |
| content-editor | ✍️ | 小修 | 内容编辑 | `#007aff` | `linear-gradient(180deg, #e8f4ff, #d4ebff)` |
| format-designer | 🎨 | 小美 | 格式设计 | `#ff9f0a` | `linear-gradient(180deg, #fff2e5, #ffe8d4)` |
| quality-reviewer | 🧐 | 小审 | 质量评审 | `#30d158` | `linear-gradient(180deg, #e5f9ed, #d4f5e0)` |

**头像组件**
- 圆形 `border-radius: 50%`
- 渐变浅色底 + `border: 0.5px solid` 对应主色 12% 透明度
- 居中大 Emoji
- 下方显示昵称（主色 600 字重）+ 角色名（灰色小字）

---

## 3. Landing 页改造

### 页面结构（从上到下）

#### 3.1 导航栏（AppShell 升级）
- 毛玻璃 sticky header
- 左：DocFlow logo + 文字
- 右："📊 用量" 按钮 + GitHub 链接 + 连接状态点（绿/灰）

#### 3.2 Hero 区域
- 大标题："AI 文档精修团队"（700 weight, 36px, `rgba(0,0,0,0.85)`）
- 副标题："四位 AI 专家组成的自主团队，为你的文档精雕细琢"（14px, `rgba(0,0,0,0.5)`）
- 下方横排 4 个 Agent 头像卡片（毛玻璃底），hover 时轻微上浮 + tooltip 显示角色简介

#### 3.3 三大亮点卡片
- 横排 3 张等宽毛玻璃卡片
- 每张：图标 + 标题 + 一行描述
  1. 🤝 **多专家协作** — 4 位 AI 专家各司其职，像真实编辑团队一样自主协作
  2. 🔄 **质量自驱迭代** — 5 维度评分，不达标自动返工，最多 3 轮打磨到位
  3. 📄 **格式零损耗** — 直接处理 docx/pptx/xlsx/pdf，排版样式原样保留

#### 3.4 统一输入区
- 一个大的毛玻璃区域，顶部 Tab 切换："上传文档" | "从描述生成"

**上传 Tab（默认）：**
- 简化拖拽区：虚线边框 + 居中图标 + "拖放文档到这里"
- 支持点击选择文件
- 上传后立即开始处理（合并 upload + process 为一步）

**生成 Tab：**
- 4 个 Starter 场景卡片（2x2 网格），点击自动填入描述：
  - 📝 学术论文润色
  - 💼 商务文档优化
  - 📊 技术报告规范化
  - 📧 公文邮件打磨
- textarea 输入区 + 格式选择器（默认 docx，其他用下拉切换）
- 胶囊发送按钮 + Ctrl+Enter 快捷键

**一键体验按钮：**
- 在 Tab 输入区下方，独立存在
- "✨ 一键体验" 胶囊按钮 + 小字 "用示例文档体验完整流程"
- 点击使用预置示例文档启动处理，零输入

---

## 4. 协作工作区（Processing View）改造

### 整体布局：左右分栏 + 底部追踪条

#### 4.1 左侧：AI 团队面板（TeamSidebar 升级）
- 标题 "AI 团队" + 轮次指示器（毛玻璃 badge "第 N 轮 / 最多 3 轮"）
- 4 个 Agent 卡片纵向排列，毛玻璃底
- 每张卡片：Emoji 头像 + 昵称 + 角色名 + 状态指示
  - 活跃：主色描边 + 微光 glow + "● 工作中"
  - 完成：绿色 "✓ 完成"
  - 待命：半透明 `opacity: 0.45`
- 每个 Agent 卡片底部：实时 token 消耗计数（小字灰色，活跃时递增动画）

#### 4.2 右侧：增强版团队聊天（ActivityStream 升级）
- 气泡式对话布局

**消息类型：**

| 类型 | 展示方式 |
|------|---------|
| agent_working | Emoji 头像 + 昵称（主色）+ 毛玻璃气泡（左上角圆角为 0） |
| agent_message | 消息之间插入虚线箭头 "✍️ 小修 → 🎨 小美" |
| score_update | 气泡内嵌 5 维度小色块（绿 ≥8、琥珀 <8） |
| rework_request | 琥珀色毛玻璃气泡 + ⚠ 图标 |
| round_start | 居中灰色分隔线 "── 第 N 轮 ──" |
| team_complete | 绿色气泡 + ✓ 对勾动画 |
| error | 红色气泡 + 错误信息 |

- 底部保留 "跳到最新" 按钮

#### 4.3 底部：质量追踪条（QualityTracker 升级）
- 横向进度条形式
- 分数历史轨迹：圆形 badge 用线连接（如 `7.5 → 8.2 → 8.8 ✓`）
- 绿色 ≥8、琥珀 <8
- 达标后显示绿色对勾动画

---

## 5. 结果页（ResultsPanel 升级）

- 大号毛玻璃卡片，居中展示
- **顶部**：✓ 完成标志 + 总分（大号数字 + "/10"）
- **5 维度展示**：横条或小色块，每个维度名 + 分数 + 进度条
- **单次 token 消耗汇总**：
  - 处理耗时（秒/分钟）
  - 总 token 数（input + output）
  - 各 Agent 分别消耗的 token 数
- **下载按钮组**：3 个胶囊按钮横排
  - 主按钮："下载精修版"
  - 次按钮："处理报告" / "原始版"
- **底部**："处理新文档" 次级按钮

---

## 6. Usage 仪表盘

### 入口
- 导航栏右侧 "📊 用量" 按钮
- 新路由 `/usage`

### 页面布局

#### 6.1 概览卡片（横排 4 张毛玻璃卡片）
| 卡片 | 数据 |
|------|------|
| 📄 总任务数 | 累计处理文档数量 |
| 🔤 总 Token 消耗 | input + output token 总量 |
| ✅ 成功率 | 成功 / 总任务百分比 |
| ⏱ 平均耗时 | 从开始到完成的平均时长 |

#### 6.2 趋势图
- 时间维度的 token 消耗折线图（按天/周）
- 系统蓝主色调，毛玻璃背景
- 使用 recharts 实现

#### 6.3 任务历史列表
- 毛玻璃卡片列表，每行一个历史任务：
  - 文件名 / 描述摘要
  - 处理模式（润色 / 生成）
  - 最终评分
  - Token 消耗（input / output 分开）
  - 耗时
  - 日期时间
- 点击可跳转查看该任务结果（如仍存在）

---

## 7. 后端变更

### 7.1 Token 追踪
- 在 Agent SDK hook 回调（`PostToolUse` / `SubagentStop`）中捕获每次 API 调用的 `usage` 字段
- 按 agent_key 累加 `input_tokens` 和 `output_tokens`
- 维护 `rework_state` 同级的 `token_state: dict[str, {input: int, output: int}]`

### 7.2 WebSocket 新消息类型
```json
{
  "type": "token_update",
  "agent": "content-editor",
  "input_tokens": 1523,
  "output_tokens": 892,
  "total_tokens": 2415
}
```
- 每次 API 调用完成后推送

### 7.3 持久化
- 任务完成后将 token 数据写入 `{task_dir}/usage.json`
- 结构：
```json
{
  "task_id": "a1b2c3d4",
  "mode": "refinement",
  "started_at": "2026-03-29T10:00:00Z",
  "completed_at": "2026-03-29T10:02:30Z",
  "duration_seconds": 150,
  "rounds": 2,
  "final_score": 8.8,
  "status": "completed",
  "agents": {
    "content-generator": {"input_tokens": 2000, "output_tokens": 1500},
    "content-editor": {"input_tokens": 3000, "output_tokens": 2000},
    "format-designer": {"input_tokens": 1500, "output_tokens": 1000},
    "quality-reviewer": {"input_tokens": 2500, "output_tokens": 800}
  },
  "total": {"input_tokens": 9000, "output_tokens": 5300}
}
```

### 7.4 新增 API
| 路由 | 方法 | 描述 |
|------|------|------|
| `/api/usage/summary` | GET | 累计统计：总任务数、总 token、成功率、平均耗时 |
| `/api/usage/history` | GET | 历史任务列表，支持分页 `?page=1&size=20` |
| `/api/usage/{task_id}` | GET | 单任务 token 明细 |

实现方式：扫描 `uploads/` 目录下所有 `usage.json` 文件汇总。

---

## 8. 新增依赖

| 依赖 | 用途 | 备注 |
|------|------|------|
| recharts | 趋势折线图 | 轻量 React 图表库 |

不引入新 CSS 框架或 UI 组件库，继续使用 Tailwind + 自定义组件。

---

## 9. 不变的部分

- WebSocket 通信机制（新增消息类型但协议不变）
- Agent SDK 编排逻辑（orchestrator/team.py 核心流程不变）
- 文档处理管线（processors/ 不变）
- 现有 REST API 接口（upload/download/generate/process/status 不变）
- 测试框架（Vitest + React Testing Library）
