# 72Hours TypeScript + React 重构方案

## 第一阶段：TypeScript 迁移

### 1.1 项目结构重构

```
72hours/
├── src/
│   ├── server/           # 后端代码
│   │   ├── index.ts      # 入口
│   │   ├── routes/       # 路由
│   │   ├── middleware/   # 中间件
│   │   └── types/        # 类型定义
│   │
│   ├── game/             # 游戏逻辑
│   │   ├── Game.ts
│   │   ├── Player.ts
│   │   ├── NPC.ts
│   │   ├── TurnManager.ts
│   │   └── types/
│   │
│   ├── narrative/        # 叙事引擎
│   │   ├── NarrativeEngine.ts
│   │   └── AIProvider.ts
│   │
│   ├── core/             # 核心系统
│   │   ├── GravityEngine.ts
│   │   ├── PressureSystem.ts
│   │   └── ...
│   │
│   ├── utils/            # 工具
│   │   ├── SaveSystem.ts
│   │   ├── Constants.ts
│   │   └── helpers.ts
│   │
│   └── types/            # 全局类型
│       ├── game.ts
│       ├── player.ts
│       └── api.ts
│
├── client/               # React 前端
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── hooks/        # 自定义 hooks
│   │   ├── stores/       # 状态管理
│   │   ├── services/     # API 服务
│   │   └── types/        # 前端类型
│   │
│   ├── public/
│   └── package.json
│
├── shared/               # 前后端共享类型
│   └── types/
│
├── tests/
├── package.json
└── tsconfig.json
```

### 1.2 核心类型定义

```typescript
// shared/types/game.ts

export interface GameState {
  turn: number;
  datetime: Date;
  pressure: number;
  omega: number;
  weather: WeatherType;
  player: Player;
  npcs: NPC[];
  history: HistoryEntry[];
  isGameOver: boolean;
}

export interface Player {
  id: string;
  identity: IdentityType;
  traits: Trait[];
  obsession: string;
  states: PlayerStates;
  position: Position;
  bondedNPCs: string[];
}

export interface NPC {
  id: string;
  name: string;
  traits: Trait[];
  obsession: string;
  states: NPCStates;
  position: Position;
  isBonded: boolean;
  isElite: boolean;
  isUnlocked: boolean;
}

export interface TurnResult {
  turn: number;
  narrative: string;
  choices: Choice[];
  state: GameState;
  context: TurnContext;
}

export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  condition?: ChoiceCondition;
}

export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';
export type TraitType = 'personality' | 'identity';

export interface Trait {
  id: string;
  type: TraitType;
  name?: string;
  description?: string;
}
```

### 1.3 后端迁移步骤

1. **安装 TypeScript 依赖**
```bash
npm install -D typescript @types/node @types/express ts-node nodemon
```

2. **创建 tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

3. **逐步迁移文件**
   - 先迁移工具类（Utils, Constants）
   - 再迁移核心类（Player, NPC, Game）
   - 最后迁移服务器代码

---

## 第二阶段：React 前端

### 2.1 技术栈选择

```
- React 18 + TypeScript
- Vite (构建工具)
- Zustand (状态管理)
- React Query (数据获取)
- Tailwind CSS (样式)
- Framer Motion (动画)
```

### 2.2 组件结构

```
client/src/
├── components/
│   ├── Game/              # 游戏主组件
│   │   ├── Game.tsx
│   │   ├── StatusBar.tsx  # 状态栏
│   │   ├── Narrative.tsx  # 叙事区域
│   │   ├── ChoiceList.tsx # 选择列表
│   │   └── SaveMenu.tsx   # 存档菜单
│   │
│   ├── Setup/             # 设置面板
│   │   ├── SetupPanel.tsx
│   │   ├── IdentitySelect.tsx
│   │   └── ModelSelect.tsx
│   │
│   └── UI/                # 通用组件
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Loading.tsx
│
├── hooks/
│   ├── useGame.ts         # 游戏逻辑 hook
│   ├── useSave.ts         # 存档 hook
│   └── useNarrative.ts    # 叙事 hook
│
├── stores/
│   └── gameStore.ts       # Zustand 状态
│
├── services/
│   └── api.ts             # API 服务
│
└── types/
    └── index.ts           # 类型定义
```

### 2.3 核心组件示例

```typescript
// client/src/components/Game/Game.tsx
import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { StatusBar } from './StatusBar';
import { Narrative } from './Narrative';
import { ChoiceList } from './ChoiceList';
import { SaveMenu } from './SaveMenu';

export const Game: React.FC = () => {
  const { gameState, isLoading, error } = useGameStore();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!gameState) return null;

  return (
    <div className="game-container">
      <StatusBar 
        turn={gameState.turn}
        datetime={gameState.datetime}
        pressure={gameState.pressure}
        omega={gameState.omega}
      />
      <Narrative text={gameState.currentNarrative} />
      <ChoiceList 
        choices={gameState.currentChoices}
        onSelect={handleChoice}
      />
    </div>
  );
};
```

```typescript
// client/src/stores/gameStore.ts
import { create } from 'zustand';
import { GameState, Choice } from '../types';
import { api } from '../services/api';

interface GameStore {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initGame: (identity: string, model: string) => Promise<void>;
  makeChoice: (choice: Choice) => Promise<void>;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: (name?: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isLoading: false,
  error: null,

  initGame: async (identity, model) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createGame(identity, model);
      set({ gameState: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  makeChoice: async (choice) => {
    const { gameState } = get();
    if (!gameState) return;

    set({ isLoading: true });
    try {
      const response = await api.makeChoice(gameState.gameId, choice);
      set({ gameState: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ... 其他 actions
}));
```

---

## 第三阶段：共享类型

### 3.1 共享类型包

创建 `shared/types` 目录，包含前后端共享的类型定义：

```typescript
// shared/types/index.ts
export * from './game';
export * from './player';
export * from './npc';
export * from './api';
```

### 3.2 类型生成

使用 `tsc` 生成类型声明文件，供前后端共享。

---

## 实施计划

### Week 1: TypeScript 迁移
- [ ] 配置 TypeScript 环境
- [ ] 创建类型定义
- [ ] 迁移工具类
- [ ] 迁移核心游戏类
- [ ] 迁移服务器代码
- [ ] 测试验证

### Week 2: React 前端
- [ ] 创建 React 项目结构
- [ ] 配置 Vite + Tailwind
- [ ] 实现 Setup 面板
- [ ] 实现 Game 面板
- [ ] 实现存档系统 UI
- [ ] 状态管理集成

### Week 3: 集成测试
- [ ] 前后端联调
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 部署配置

---

## 预期收益

| 方面 | 改进 |
|------|------|
| 代码质量 | TypeScript 类型检查减少运行时错误 |
| 开发效率 | React 组件化 + 热更新 |
| 用户体验 | 更流畅的交互，更好的视觉效果 |
| 可维护性 | 清晰的类型定义和组件结构 |
| 可扩展性 | 更容易添加新功能 |
