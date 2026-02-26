# 72Hours 文档索引

> 项目文档导航与阅读指南

## 📚 核心文档

### 入门必读
| 文档 | 说明 | 阅读顺序 |
|------|------|----------|
| [README.md](../README.md) | 项目简介、快速开始 | 1 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 技术架构详解 | 2 |
| [DESIGN.md](../DESIGN.md) | 核心设计理念 | 3 |

### 机制详解
| 文档 | 说明 |
|------|------|
| [EMERGENT_MECHANICS.md](EMERGENT_MECHANICS.md) | 涌现式叙事机制总览 |
| [IMPLEMENTATION_GAP.md](../IMPLEMENTATION_GAP.md) | 设计理念 vs 代码实现对比 |

## 🎮 游戏设计文档

### 角色系统
| 文档 | 内容 |
|------|------|
| [PLAYERS.md](../PLAYERS.md) | 玩家身份设计（读书人/地主/士兵/教徒） |
| [NPCS.md](../NPCS.md) | NPC设计（精英NPC、关联NPC、普通NPC） |
| [TRAITS.md](../TRAITS.md) | 特质系统（身份特质、性格特质） |

### 事件系统
| 文档 | 内容 |
|------|------|
| [EVENTS.md](../EVENTS.md) | 历史锚点事件、随机事件设计 |

## 🔧 技术文档

### API 文档
| 文档 | 内容 |
|------|------|
| [API.md](../API.md) | REST API 接口文档 |
| [API_CONSISTENCY_CHECK.md](../API_CONSISTENCY_CHECK.md) | API一致性检查报告 |

### 开发文档
| 文档 | 内容 |
|------|------|
| [REFACTOR_PLAN.md](../REFACTOR_PLAN.md) | 重构计划与进度 |
| [DEPLOY.md](../DEPLOY.md) | 部署指南 |

### 审计与测试
| 文档 | 内容 |
|------|------|
| [PROJECT_AUDIT.md](../PROJECT_AUDIT.md) | 项目审计报告 |
| [FRONTEND_AUDIT_REPORT.md](../FRONTEND_AUDIT_REPORT.md) | 前端审计报告 |
| [AVG_ANALYSIS_REPORT.md](../AVG_ANALYSIS_REPORT.md) | 平均值分析报告 |
| [DEEP_INSPECTION_REPORT.md](../DEEP_INSPECTION_REPORT.md) | 深度检查报告 |

## 📖 推荐阅读路径

### 新成员入门
1. **README.md** - 了解项目是什么
2. **DESIGN.md** - 理解设计理念
3. **ARCHITECTURE.md** - 掌握技术架构
4. **EMERGENT_MECHANICS.md** - 深入涌现机制

### 开发者路径
1. **ARCHITECTURE.md** - 理解代码结构
2. **API.md** - 掌握接口规范
3. **IMPLEMENTATION_GAP.md** - 了解当前实现状态
4. **REFACTOR_PLAN.md** - 查看开发计划

### 设计师路径
1. **DESIGN.md** - 核心设计理念
2. **EMERGENT_MECHANICS.md** - 涌现机制详解
3. **PLAYERS.md** / **NPCS.md** / **TRAITS.md** - 角色系统
4. **EVENTS.md** - 事件设计

## 🗂️ 文档状态

| 文档 | 状态 | 最后更新 |
|------|------|----------|
| README.md | ✅ 已更新 | 2026-02-26 |
| ARCHITECTURE.md | ✅ 已更新 | 2026-02-26 |
| DESIGN.md | ✅ 稳定 | 2026-02-24 |
| EMERGENT_MECHANICS.md | ✅ 已更新 | 2026-02-26 |
| IMPLEMENTATION_GAP.md | ✅ 稳定 | 2026-02-26 |
| API.md | ✅ 稳定 | 2026-02-25 |

## 📝 文档规范

### 文件命名
- 大写字母 + 下划线分隔
- 英文描述性名称
- `.md` 扩展名

### 内容格式
- 使用 Markdown 语法
- 代码块标注语言类型
- 表格用于结构化数据
- 使用相对路径链接

### 更新维护
- 重大更新记录版本号
- 在文档底部标注最后更新日期
- 保持与代码实现同步

---

*文档索引版本: v1.0*
*最后更新: 2026-02-26*
