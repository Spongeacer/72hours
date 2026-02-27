/**
 * AI驱动的涌现式选择生成器
 * 调用 AI API 基于玩家特质/执念 + NPC行为 + 情境生成玩家反应
 */

import { AI_CONFIG } from '../config/GameConfig';

// 玩家类型定义
interface Player {
  identity: { name: string };
  obsession: string;
  traits: Array<{ id: string }>;
  states: {
    fear: number;
    aggression: number;
    hunger: number;
  };
  identityType?: string;
}

export interface PlayerReaction {
  id: string;
  text: string;
  type: 'instinct' | 'obsession' | 'trait' | 'context';
  drive: string;
  effect: {
    fear?: number;
    aggression?: number;
    hunger?: number;
    injury?: number;
  };
}

export interface NPCBehavior {
  type: '抢夺' | '冲突' | '偷听' | '聊天' | '请求' | '给予';
  description: string;
  npcName: string;
  npcTraits: string[];
  npcObsession: string;
}

export interface Context {
  pressure: number;
  omega: number;
  weather: string;
  turn: number;
  narrative: string;
}

// 全局fetch声明（Node.js 18+）
declare const fetch: typeof globalThis.fetch;

/**
 * 使用 AI API 生成玩家反应
 */
export async function generatePlayerReactionsWithAI(
  player: Player,
  _npcBehavior: NPCBehavior,
  context: Context
): Promise<PlayerReaction[]> {
  const provider = AI_CONFIG.DEFAULT_PROVIDER;
  const config = AI_CONFIG.PROVIDERS[provider];
  
  const prompt = buildPrompt(player, _npcBehavior, context);
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [
          { role: 'system', content: '你是一个涌现式叙事引擎，专门生成基于角色特质和情境的玩家反应选项。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0].message.content;
    
    return parseAIResponse(content, player);
    
  } catch (error) {
    console.error('AI generation failed:', error);
    // 降级到本地生成
    return generateFallbackReactions(player);
  }
}

/**
 * 构建 AI Prompt
 */
export function buildPrompt(player: Player, npcBehavior: NPCBehavior, context: Context): string {
  const traitIds = player.traits.map(t => t.id).join('、');
  
  return `
【情境】
第${context.turn}/36回合，${context.weather === 'night' ? '深夜' : context.weather === 'fog' ? '雾中' : '白天'}
压强：${Math.round(context.pressure)}/20，历史必然感：${Math.round(context.omega)}/20

【玩家】
身份：${player.identity.name}
执念：${player.obsession}
特质：${traitIds}
当前状态：恐惧${player.states.fear}/攻击${player.states.aggression}/饥饿${player.states.hunger}

【聚光灯NPC】
姓名：${npcBehavior.npcName}
行为：${npcBehavior.type} - ${npcBehavior.description}
执念：${npcBehavior.npcObsession}
特质：${npcBehavior.npcTraits.join('、')}

【叙事】
${context.narrative}

【任务】
基于玩家的执念、特质和当前状态，以及NPC的行为，生成3个玩家可能的反应。

每个反应应该：
1. 反应1：基于玩家执念（最深层驱动）
2. 反应2：基于玩家主导特质（性格驱动）  
3. 反应3：基于本能/情境（状态驱动）

格式要求（JSON）：
{
  "reactions": [
    {
      "text": "玩家反应的描述，用第二人称",
      "type": "obsession",
      "drive": "说明是哪个执念/特质/状态驱动的",
      "effect": { "fear": 0, "aggression": 0, "hunger": 0 }
    }
  ]
}

注意：
- 每个反应要独特，反映不同的内在驱动
- 效果值范围-3到+3
- 用中文，第二人称（你...）
- 描述要有氛围感，符合1851年金田村的情境
`;
}

/**
 * 解析 AI 响应
 */
export function parseAIResponse(content: string, player: Player): PlayerReaction[] {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as { reactions?: unknown[] };
    const reactions = parsed.reactions || [];
    
    return reactions.map((r: unknown, idx: number) => {
      const reaction = r as { text?: string; type?: string; drive?: string; effect?: Record<string, number> };
      return {
        id: `ai_${player.identityType || 'unknown'}_${idx}_${Date.now()}`,
        text: reaction.text || '你做出了反应',
        type: (reaction.type as PlayerReaction['type']) || 'context',
        drive: reaction.drive || 'AI生成',
        effect: reaction.effect || {}
      };
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    // 解析失败时使用文本分割
    return parseTextResponse(content, player);
  }
}

/**
 * 文本解析（降级方案）
 */
function parseTextResponse(content: string, player: Player): PlayerReaction[] {
  const lines = content.split('\n').filter(l => l.trim());
  const reactions: PlayerReaction[] = [];
  
  const types: PlayerReaction['type'][] = ['obsession', 'trait', 'instinct'];
  
  for (let i = 0; i < lines.length && reactions.length < 3; i++) {
    const line = lines[i].trim();
    // 匹配 "1. " 或 "反应1：" 等格式
    // eslint-disable-next-line no-useless-escape
    if (/^\d+[.．]/.test(line) || line.includes('：') || line.includes('反应')) {
      // eslint-disable-next-line no-useless-escape
      const text = line.replace(/^\d+[.．]\s*/, '').replace(/^反应\d+[：:]\s*/, '');
      if (text.length > 10) {
        reactions.push({
          id: `text_${player.identityType || 'unknown'}_${reactions.length}_${Date.now()}`,
          text: text,
          type: types[reactions.length] || 'instinct',
          drive: 'AI生成（文本解析）',
          effect: {}
        });
      }
    }
  }
  
  return reactions;
}

/**
 * 本地降级生成（AI失败时使用）
 */
export function generateFallbackReactions(player: Player): PlayerReaction[] {
  const reactions: PlayerReaction[] = [];
  
  // 基于执念
  reactions.push({
    id: `fallback_obsession_${Date.now()}`,
    text: `你想起自己的执念「${player.obsession}」，这让你做出了选择`,
    type: 'obsession',
    drive: `执念：${player.obsession}`,
    effect: { fear: -1 }
  });
  
  // 基于特质
  const trait = player.traits[0]?.id || 'calm';
  reactions.push({
    id: `fallback_trait_${Date.now()}`,
    text: `你的「${trait}」特质让你选择了这样的方式应对`,
    type: 'trait',
    drive: `特质：${trait}`,
    effect: {}
  });
  
  // 基于情境
  reactions.push({
    id: `fallback_instinct_${Date.now()}`,
    text: '你凭着本能做出了反应',
    type: 'instinct',
    drive: '本能反应',
    effect: {}
  });
  
  return reactions;
}

export default {
  generatePlayerReactionsWithAI
};
