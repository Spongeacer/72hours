/**
 * 请求验证 Schemas
 * 使用 Zod 定义
 */

import { z } from 'zod';

// ==================== 基础 Schemas ====================

export const identitySchema = z.enum(['scholar', 'landlord', 'soldier', 'cultist']);

export const modelSchema = z.enum([
  'Pro/MiniMaxAI/MiniMax-M2.5',
  'deepseek-ai/DeepSeek-V3.2'
]);

export const gameIdSchema = z.string().regex(/^game_[a-z0-9_]+$/, '无效的游戏ID格式');

export const saveIdSchema = z.string().regex(/^save_[a-z0-9_]+$/, '无效的存档ID格式');

// ==================== 游戏 Schemas ====================

export const gameSchemas = {
  // 创建游戏
  createGame: z.object({
    body: z.object({
      identity: identitySchema,
      model: modelSchema,
      apiKey: z.string().optional()
    }),
    query: z.object({}).optional(),
    params: z.object({})
  }),

  // 游戏ID参数
  gameId: z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({
      gameId: gameIdSchema
    })
  }),

  // 执行回合
  executeTurn: z.object({
    body: z.object({
      choice: z.object({
        id: z.string(),
        text: z.string()
      }).optional()
    }),
    query: z.object({}).optional(),
    params: z.object({
      gameId: gameIdSchema
    })
  })
};

// ==================== 存档 Schemas ====================

export const saveSchemas = {
  // 创建存档
  createSave: z.object({
    body: z.object({
      name: z.string().max(50).optional()
    }),
    query: z.object({}).optional(),
    params: z.object({
      gameId: gameIdSchema
    })
  }),

  // 存档ID参数
  saveId: z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({
      gameId: gameIdSchema,
      saveId: saveIdSchema
    })
  }),

  // 导入存档
  importSave: z.object({
    body: z.object({
      saveData: z.string().min(1, '存档数据不能为空')
    }),
    query: z.object({}).optional(),
    params: z.object({
      gameId: gameIdSchema
    })
  })
};

// ==================== 配置 Schemas ====================

export const configSchemas = {
  getConfig: z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({})
  })
};
