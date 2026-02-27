# 类型管理规范

## 目录结构

```
shared/types/          # 前后端共享类型
├── index.ts          # 统一导出
├── base.ts           # 基础类型（IdentityType, WeatherType, Position, Trait）
├── player.ts         # 玩家相关（Player, Identity, Item, Memory）
├── npc.ts            # NPC相关（NPC, NPCStates）
├── game.ts           # 游戏状态（GameState, Choice, TurnResult）
└── save.ts           # 存档相关（SaveData, SaveSummary）

src/server/types/      # 后端专属类型
├── index.ts          # 统一导出
└── api.ts            # API相关（ApiResponse, ErrorCode, 请求/响应类型）

src/game/index.ts      # 游戏核心模块导出（类 + 重新导出shared/types）

client/src/types/      # 前端专属类型
└── index.ts          # 统一导出（从shared/types重新导出 + 前端专属类型）
```

## 使用规范

### 1. 优先使用统一导出

```typescript
// ✅ 推荐
import type { Player, GameState } from '../game';
import type { ApiResponse } from '../types';

// ❌ 避免直接引用深层文件
import type { Player } from '../game/Player';
```

### 2. 共享类型 vs 专属类型

| 类型 | 位置 | 说明 |
|------|------|------|
| Player, NPC, GameState | shared/types/ | 前后端共享 |
| ApiResponse, ErrorCode | src/server/types/ | 后端API专属 |
| FrontendTurnResult | client/src/types/ | 前端扩展类型 |

### 3. 类型扩展

如需扩展共享类型，使用继承：

```typescript
// client/src/types/index.ts
export interface FrontendTurnResult extends TurnResult {
  spotlightNPC?: NPC | null;
  playerAura?: string;
}
```

### 4. 禁止的做法

- ❌ 在多个地方定义相同的类型
- ❌ 直接修改 shared/types 中的类型
- ❌ 后端代码引用 client/src/types
- ❌ 循环引用（A引用B，B引用A）

## 维护检查清单

- [ ] 新增类型时先判断归属（共享/后端/前端）
- [ ] 更新对应的 index.ts 导出
- [ ] 运行 `npm run type-check` 检查类型一致性
- [ ] 检查是否有重复的类型定义
