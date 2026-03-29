# TODOs

来源: CEO Plan Review (2026-03-29)

## Accepted but Deferred

- [ ] **文风 DNA（个人风格学习）** — 用户上传标杆文档，系统提取写作风格（用词偏好、句式节奏、段落结构），后续生成/精修自动套用。pipeline.py 已预留 `style_dna_id` 参数。CEO plan 评为"长期粘性核心"。
  - 需要: 风格提取算法、风格存储、编辑器注入逻辑、前端管理 UI

## Deferred (CEO Plan)

- [ ] **学术模板市场** — 以 Claude Code skill 集成方式实现，不做静态模板系统
- [ ] **可分享处理会话** — 生成唯一 URL，他人可回放 AI 编辑过程。依赖持久化和权限系统
- [ ] **批量处理** — 一次上传多份文档并行处理。单文档跑通后自然扩展

## Low Priority

- [ ] `/api/health` 端点 — 当前 health 在 `/health`，与 `/api/*` 前缀不一致 (QA ISSUE-003)
