/**
 * AI 集成测试
 * 验证 SiliconFlow API 调用是否正常
 * 
 * 测试范围:
 * 1. API 连接测试
 * 2. MiniMax-M2.5 模型调用测试
 * 3. 叙事生成功能测试
 * 4. 响应时间和错误处理测试
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

// ==================== 配置常量 ====================

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || '';
const BASE_URL = 'https://api.siliconflow.cn/v1';
const DEFAULT_MODEL = 'Pro/MiniMaxAI/MiniMax-M2.5';
const TIMEOUT_MS = 30000; // 30秒超时
const MAX_RESPONSE_TIME_MS = 10000; // 期望最大响应时间

// ==================== 类型定义 ====================

interface APIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface APIError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

interface TestResult {
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

// ==================== SiliconFlow AI 类 ====================

class SiliconFlowAI {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = BASE_URL;
  }

  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          duration,
          error: `API 连接失败: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        duration,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error.message || '未知错误'
      };
    }
  }

  /**
   * 生成文本（通用方法）
   */
  async generate(messages: { role: string; content: string }[]): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 500,
          stream: false
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData: APIError = await response.json();
        return {
          success: false,
          duration,
          error: errorData.error?.message || `HTTP ${response.status}`
        };
      }

      const data: APIResponse = await response.json();
      return {
        success: true,
        duration,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error.message || '未知错误'
      };
    }
  }

  /**
   * 生成叙事文本
   */
  async generateNarrative(context: {
    turn: number;
    player: {
      identity: string;
      traits: string[];
      obsession: string;
      states: { fear: number; aggression: number; hunger: number; injury: number };
    };
    pressure: number;
    omega: number;
    weather: string;
  }): Promise<TestResult> {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据游戏状态生成沉浸式的叙事文本。

风格要求：
- 粗粝、留白、时代感（1851年清末）
- 强调动作细节和环境渗透
- 不解释角色心理，只呈现外在行为
- 100-150字，一个完整的瞬间
- 使用第二人称"你"

禁止：
- 现代用语和网络用语
- 直白的心理描写
- 解释性的叙述`;

    const userPrompt = `游戏状态：
- 回合: ${context.turn}/72
- 玩家身份: ${context.player.identity}
- 玩家特质: ${context.player.traits.join('、')}
- 玩家执念: ${context.player.obsession}
- 玩家状态: 恐惧${context.player.states.fear} | 攻击性${context.player.states.aggression} | 饥饿${context.player.states.hunger} | 伤势${context.player.states.injury}
- 环境压强: ${context.pressure.toFixed(1)}
- 全局因子Ω: ${context.omega.toFixed(2)}
- 天气: ${context.weather}

请生成一段叙事文本。`;

    return this.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
  }

  /**
   * 生成选择
   */
  async generateChoices(context: {
    narrative: string;
    player: { states: { fear: number; aggression: number } };
  }): Promise<TestResult> {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据当前场景生成3个开放的选择。

格式要求：
- 以"你..."开头
- 描述动作或状态，不预设结果
- 每个选择15-25字
- 选择之间要有明显的风格差异`;

    const userPrompt = `当前场景：
${context.narrative}

玩家状态：恐惧${context.player.states.fear}% | 攻击性${context.player.states.aggression}%

请生成3个选择，格式为：
1. [选择1]
2. [选择2]
3. [选择3]`;

    return this.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
  }

  /**
   * 生成执念
   */
  async generateObsession(data: {
    identity: string;
    traits: string[];
    traitsDesc: string;
  }): Promise<TestResult> {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据玩家身份和特质生成一个执念（Obsession）。

执念要求：
- 简短有力，10-20字
- 体现人物核心驱动力
- 与时代背景（1851年清末）相符
- 使用第一人称"我"`;

    const userPrompt = `玩家身份: ${data.identity}
玩家特质: ${data.traits.join('、')}

请生成一个执念。`;

    return this.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
  }
}

// ==================== 测试套件 ====================

describe('SiliconFlow AI 集成测试', () => {
  let ai: SiliconFlowAI;

  beforeAll(() => {
    // 验证 API Key 存在
    if (!SILICONFLOW_API_KEY) {
      console.warn('⚠️  警告: 未设置 SILICONFLOW_API_KEY 环境变量，部分测试可能失败');
    }
    ai = new SiliconFlowAI(SILICONFLOW_API_KEY, DEFAULT_MODEL);
  });

  // ==================== 测试 1: API 连接 ====================

  describe('API 连接测试', () => {
    it('应该成功连接到 SiliconFlow API', async () => {
      const result = await ai.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.data).toBeDefined();
      expect(result.data.data).toBeDefined();
    }, TIMEOUT_MS);

    it('应该返回可用的模型列表', async () => {
      const result = await ai.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.data.data).toBeInstanceOf(Array);
      expect(result.data.data.length).toBeGreaterThan(0);
      
      // 验证 MiniMax-M2.5 是否在列表中
      const models = result.data.data.map((m: any) => m.id);
      const hasMiniMax = models.some((id: string) => 
        id.includes('MiniMax') || id.includes('minimax')
      );
      expect(hasMiniMax).toBe(true);
    }, TIMEOUT_MS);

    it('应该在 API Key 无效时返回错误', async () => {
      const invalidAI = new SiliconFlowAI('invalid-api-key', DEFAULT_MODEL);
      const result = await invalidAI.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, TIMEOUT_MS);
  });

  // ==================== 测试 2: MiniMax-M2.5 模型调用 ====================

  describe('MiniMax-M2.5 模型调用测试', () => {
    it('应该成功调用 MiniMax-M2.5 模型', async () => {
      const messages = [
        { role: 'system', content: '你是一个有帮助的助手。' },
        { role: 'user', content: '你好，请用一句话介绍自己。' }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.data).toBeDefined();
      expect(result.data.choices).toBeInstanceOf(Array);
      expect(result.data.choices.length).toBeGreaterThan(0);
      expect(result.data.choices[0].message.content).toBeTruthy();
    }, TIMEOUT_MS);

    it('应该返回正确的响应结构', async () => {
      const messages = [
        { role: 'user', content: '你好' }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        object: 'chat.completion',
        created: expect.any(Number),
        model: expect.stringContaining('MiniMax'),
        choices: expect.arrayContaining([
          expect.objectContaining({
            index: expect.any(Number),
            message: expect.objectContaining({
              role: 'assistant',
              content: expect.any(String)
            }),
            finish_reason: expect.any(String)
          })
        ]),
        usage: expect.objectContaining({
          prompt_tokens: expect.any(Number),
          completion_tokens: expect.any(Number),
          total_tokens: expect.any(Number)
        })
      });
    }, TIMEOUT_MS);

    it('应该正确处理中文内容', async () => {
      const messages = [
        { role: 'user', content: '请用中文描述一个雨夜的场景，不超过50字。' }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.data.choices[0].message.content).toContain('雨');
    }, TIMEOUT_MS);
  });

  // ==================== 测试 3: 叙事生成功能 ====================

  describe('叙事生成功能测试', () => {
    const mockGameState = {
      turn: 5,
      player: {
        identity: '村中的读书人',
        traits: ['冷静', '好奇'],
        obsession: '在乱世中活下去',
        states: { fear: 30, aggression: 20, hunger: 40, injury: 0 }
      },
      pressure: 25.5,
      omega: 1.2,
      weather: 'night'
    };

    it('应该生成叙事文本', async () => {
      const result = await ai.generateNarrative(mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.data.choices[0].message.content).toBeTruthy();
      expect(result.data.choices[0].message.content.length).toBeGreaterThan(20);
    }, TIMEOUT_MS);

    it('生成的叙事应该使用第二人称', async () => {
      const result = await ai.generateNarrative(mockGameState);
      
      expect(result.success).toBe(true);
      const content = result.data.choices[0].message.content;
      expect(content).toMatch(/你/);
    }, TIMEOUT_MS);

    it('应该生成玩家选择', async () => {
      const narrativeResult = await ai.generateNarrative(mockGameState);
      const narrative = narrativeResult.data.choices[0].message.content;
      
      const choicesResult = await ai.generateChoices({
        narrative,
        player: { states: { fear: 30, aggression: 20 } }
      });
      
      expect(choicesResult.success).toBe(true);
      expect(choicesResult.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      
      const content = choicesResult.data.choices[0].message.content;
      expect(content).toMatch(/你/);
    }, TIMEOUT_MS);

    it('应该生成玩家执念', async () => {
      const result = await ai.generateObsession({
        identity: '村中的读书人',
        traits: ['冷静', '好奇'],
        traitsDesc: '冷静、好奇'
      });
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(result.data.choices[0].message.content).toBeTruthy();
    }, TIMEOUT_MS);
  });

  // ==================== 测试 4: 响应时间和错误处理 ====================

  describe('响应时间和错误处理测试', () => {
    it('应该在合理时间内响应（<10秒）', async () => {
      const messages = [
        { role: 'user', content: '你好' }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
      console.log(`响应时间: ${result.duration}ms`);
    }, TIMEOUT_MS);

    it('应该处理长提示词', async () => {
      const longPrompt = '请描述一个场景。'.repeat(50);
      const messages = [
        { role: 'user', content: longPrompt }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(MAX_RESPONSE_TIME_MS * 2);
    }, TIMEOUT_MS * 2);

    it('应该在 API Key 无效时返回认证错误', async () => {
      const invalidAI = new SiliconFlowAI('invalid-key', DEFAULT_MODEL);
      const messages = [
        { role: 'user', content: '你好' }
      ];
      
      const result = await invalidAI.generate(messages);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, TIMEOUT_MS);

    it('应该处理空消息列表的边界情况', async () => {
      const result = await ai.generate([]);
      
      // API 应该返回错误，而不是崩溃
      expect(result.success).toBe(false);
    }, TIMEOUT_MS);

    it('应该处理特殊字符', async () => {
      const messages = [
        { role: 'user', content: '测试特殊字符: <>"\'&©®™' }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
    }, TIMEOUT_MS);

    it('应该处理并发请求', async () => {
      const promises = Array(3).fill(null).map((_, i) => 
        ai.generate([
          { role: 'user', content: `并发测试请求 ${i + 1}` }
        ])
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        console.log(`并发请求 ${index + 1} 响应时间: ${result.duration}ms`);
      });
    }, TIMEOUT_MS * 3);
  });

  // ==================== 测试 5: 模型特定功能 ====================

  describe('MiniMax-M2.5 特定功能测试', () => {
    it('应该支持系统提示词', async () => {
      const messages = [
        { 
          role: 'system', 
          content: '你是一个专业的历史学者，专门研究1851年的中国历史。' 
        },
        { 
          role: 'user', 
          content: '简要描述1851年1月金田村的情况。' 
        }
      ];
      
      const result = await ai.generate(messages);
      
      expect(result.success).toBe(true);
      expect(result.data.choices[0].message.content).toBeTruthy();
    }, TIMEOUT_MS);

    it('应该支持多轮对话', async () => {
      // 第一轮
      const result1 = await ai.generate([
        { role: 'user', content: '我叫张三，记住我的名字。' }
      ]);
      expect(result1.success).toBe(true);
      
      // 第二轮（上下文应该被保留）
      const result2 = await ai.generate([
        { role: 'user', content: '我叫张三，记住我的名字。' },
        { role: 'assistant', content: result1.data.choices[0].message.content },
        { role: 'user', content: '我刚才说了我叫什么？' }
      ]);
      
      expect(result2.success).toBe(true);
      expect(result2.data.choices[0].message.content).toMatch(/张三/);
    }, TIMEOUT_MS);
  });
});

// ==================== 性能基准测试 ====================

describe('性能基准测试', () => {
  let ai: SiliconFlowAI;

  beforeAll(() => {
    ai = new SiliconFlowAI(SILICONFLOW_API_KEY, DEFAULT_MODEL);
  });

  it('应该记录平均响应时间', async () => {
    const iterations = 3;
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await ai.generate([
        { role: 'user', content: '你好' }
      ]);
      
      if (result.success) {
        times.push(result.duration);
      }
      
      // 短暂延迟避免速率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`最小响应时间: ${Math.min(...times)}ms`);
    console.log(`最大响应时间: ${Math.max(...times)}ms`);
    
    expect(avgTime).toBeLessThan(MAX_RESPONSE_TIME_MS);
  }, TIMEOUT_MS * 5);
});

export { SiliconFlowAI, DEFAULT_MODEL, BASE_URL };
