"use strict";
/**
 * 统一响应格式的 games 路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validateRequest_1 = require("../middleware/validateRequest");
const apiResponse_1 = require("../utils/apiResponse");
const GameConfig_1 = require("../../config/GameConfig");
const AIReactionGenerator_1 = require("../../core/AIReactionGenerator");
const router = (0, express_1.Router)();
const games = new Map();
// 生成请求ID
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
// Schemas
const createGameSchema = zod_1.z.object({
    identity: zod_1.z.enum(['scholar', 'landlord', 'soldier', 'cultist']),
    model: zod_1.z.string().optional(),
    apiKey: zod_1.z.string().optional()
});
const executeTurnSchema = zod_1.z.object({
    choice: zod_1.z.object({
        id: zod_1.z.string(),
        text: zod_1.z.string()
    }).optional()
});
// 创建游戏
router.post('/', (0, validateRequest_1.validateRequest)({ body: createGameSchema }), async (req, res) => {
    const requestId = generateRequestId();
    try {
        const { identity, model, apiKey } = req.body;
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 随机选择身份（如果未指定）
        const availableIdentities = Object.keys(GameConfig_1.PLAYER_CONFIG.IDENTITIES);
        const selectedIdentity = identity || availableIdentities[Math.floor(Math.random() * availableIdentities.length)];
        const identityConfig = GameConfig_1.PLAYER_CONFIG.IDENTITIES[selectedIdentity];
        // 随机执念
        const randomObsession = GameConfig_1.PLAYER_CONFIG.OBSESSIONS[Math.floor(Math.random() * GameConfig_1.PLAYER_CONFIG.OBSESSIONS.length)];
        // 随机特质
        const numTraits = GameConfig_1.PLAYER_CONFIG.MIN_TRAITS + Math.floor(Math.random() * (GameConfig_1.PLAYER_CONFIG.MAX_TRAITS - GameConfig_1.PLAYER_CONFIG.MIN_TRAITS + 1));
        const shuffledTraits = [...GameConfig_1.PLAYER_CONFIG.TRAITS].sort(() => 0.5 - Math.random());
        const selectedTraits = shuffledTraits.slice(0, numTraits);
        const player = {
            id: `player_${Date.now()}`,
            name: '你',
            identityType: selectedIdentity,
            identity: identityConfig,
            traits: selectedTraits,
            obsession: randomObsession,
            states: { ...identityConfig.initialStates },
            position: { x: 0, y: 0 }
        };
        // 生成10个NPC（初始全部锁定）
        const shuffledNPCNames = [...GameConfig_1.NPC_CONFIG.NPC_NAME_POOL].sort(() => 0.5 - Math.random());
        const allNPCs = shuffledNPCNames.map((name, index) => ({
            id: `npc_${Date.now()}_${index + 1}`,
            name,
            traits: [],
            isBonded: index < GameConfig_1.NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
            isUnlocked: index < GameConfig_1.NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
            unlockStage: index < GameConfig_1.NPC_CONFIG.INITIAL_UNLOCKED_COUNT ? 1 : index < 8 ? 2 : 3
        }));
        const gameState = {
            turn: 0,
            datetime: new Date(GameConfig_1.GAME_CONFIG.START_DATE).toISOString(),
            pressure: GameConfig_1.GAME_CONFIG.INITIAL_PRESSURE,
            omega: GameConfig_1.GAME_CONFIG.INITIAL_OMEGA,
            weather: 'night',
            player,
            npcs: allNPCs,
            history: [],
            isGameOver: false,
            storyEvent: 0
        };
        games.set(gameId, { id: gameId, state: gameState, model: model || GameConfig_1.AI_CONFIG.DEFAULT_PARAMS.model, apiKey });
        const openings = {
            scholar: `> 你被一阵奇怪的声音惊醒。\n> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。\n> 你走到窗边，看到远处有火光，不是灯笼的颜色。\n> 这是金田村，1851年1月8日，凌晨。\n> 你是一个读书人，不知道历史已经开始了。`,
            landlord: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。\n> 窗外有火光，不是灯笼，是火把。\n> 你想起韦昌辉——那个被你排挤过的小地主，现在据说在会众里很有地位。`,
            soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。\n> 上峰说金田有会匪，格杀勿论。\n> 你舔了舔嘴唇，有点干。`,
            cultist: `> 十字架贴在胸口，已经温热了。\n> 密信上的字你背得出来："十一日，万寿起义。"\n> 还有三天。上帝会保护他的子民，但你也握紧了刀。`
        };
        res.status(201).json((0, apiResponse_1.createSuccessResponse)({
            gameId,
            player: {
                id: player.id,
                name: player.name,
                identityType: player.identityType,
                identity: player.identity,
                traits: player.traits,
                obsession: player.obsession,
                states: player.states,
                position: player.position
            },
            bondedNPCs: allNPCs.filter((npc) => npc.isUnlocked).map((npc) => ({
                id: npc.id,
                name: npc.name,
                traits: npc.traits,
                isBonded: npc.isBonded,
                isUnlocked: npc.isUnlocked
            })),
            opening: openings[identity] || openings.scholar,
            state: {
                turn: gameState.turn,
                datetime: gameState.datetime,
                pressure: gameState.pressure,
                omega: gameState.omega,
                weather: gameState.weather,
                isGameOver: gameState.isGameOver
            }
        }, requestId));
    }
    catch (error) {
        res.status(500).json((0, apiResponse_1.createErrorResponse)('GAME_INIT_FAILED', error.message || '创建游戏失败', undefined, requestId));
    }
});
// 获取游戏状态
router.get('/:id/state', (req, res) => {
    const requestId = generateRequestId();
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json((0, apiResponse_1.createErrorResponse)('GAME_NOT_FOUND', '游戏不存在或已结束', undefined, requestId));
    }
    res.json((0, apiResponse_1.createSuccessResponse)({
        turn: game.state.turn,
        datetime: game.state.datetime,
        pressure: game.state.pressure,
        omega: game.state.omega,
        weather: game.state.weather,
        isGameOver: game.state.isGameOver
    }, requestId));
});
// 执行回合
router.post('/:id/turns', (0, validateRequest_1.validateRequest)({ body: executeTurnSchema }), async (req, res) => {
    const requestId = generateRequestId();
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json((0, apiResponse_1.createErrorResponse)('GAME_NOT_FOUND', '游戏不存在或已结束', undefined, requestId));
    }
    if (game.state.isGameOver) {
        return res.status(400).json((0, apiResponse_1.createErrorResponse)('GAME_ALREADY_OVER', '游戏已结束', undefined, requestId));
    }
    try {
        const { choice } = req.body;
        const state = game.state;
        // 验证选择
        if (choice) {
            const validation = (0, apiResponse_1.validateChoice)(choice);
            if (!validation.valid) {
                return res.status(400).json((0, apiResponse_1.createErrorResponse)('INVALID_CHOICE', validation.error || '无效的选择', undefined, requestId));
            }
        }
        state.turn++;
        const current = new Date(state.datetime);
        current.setHours(current.getHours() + 2); // 每2小时一个回合
        state.datetime = current.toISOString();
        // 压强增长 (1-20范围)
        state.pressure = Math.min(GameConfig_1.GAME_CONFIG.MAX_PRESSURE, state.pressure + GameConfig_1.GAME_CONFIG.PRESSURE_INCREASE);
        // Ω增长 = 基础线性增长 + 玩家选择的蝴蝶效应加速
        // 基础增长保证事件稳定触发，玩家选择可以加速进程
        let omegaIncrease = GameConfig_1.BUTTERFLY_EFFECT_CONFIG.BASE_OMEGA_INCREASE;
        // 玩家选择的蝴蝶效应：额外加速
        if (choice) {
            const butterflyEffect = Math.random();
            if (butterflyEffect < GameConfig_1.BUTTERFLY_EFFECT_CONFIG.NO_BOOST_CHANCE) {
                omegaIncrease += GameConfig_1.BUTTERFLY_EFFECT_CONFIG.BOOST_VALUES.NO_BOOST;
            }
            else if (butterflyEffect < GameConfig_1.BUTTERFLY_EFFECT_CONFIG.NO_BOOST_CHANCE + GameConfig_1.BUTTERFLY_EFFECT_CONFIG.MINOR_BOOST_CHANCE) {
                omegaIncrease += GameConfig_1.BUTTERFLY_EFFECT_CONFIG.BOOST_VALUES.MINOR;
            }
            else {
                omegaIncrease += GameConfig_1.BUTTERFLY_EFFECT_CONFIG.BOOST_VALUES.SIGNIFICANT;
            }
        }
        // 高压时 Ω 额外加速
        if (state.pressure >= GameConfig_1.GAME_CONFIG.HIGH_PRESSURE_THRESHOLD) {
            state.omega = Math.min(GameConfig_1.GAME_CONFIG.MAX_OMEGA, state.omega * GameConfig_1.GAME_CONFIG.OMEGA_HIGH_PRESSURE_MULTIPLIER + omegaIncrease);
        }
        else {
            state.omega = Math.min(GameConfig_1.GAME_CONFIG.MAX_OMEGA, state.omega + omegaIncrease);
        }
        const hour = current.getHours();
        if (hour >= 6 && hour < 18) {
            state.weather = 'clear';
        }
        else if (hour >= 20 || hour < 5) {
            state.weather = 'night';
        }
        else {
            state.weather = 'fog';
        }
        const narratives = [
            `> 第${state.turn}回合。你站在村子里，空气中弥漫着紧张的气氛。\n> 远处传来人声，不知道是谁在说话。`,
            `> 夜色更深了。你感到一种莫名的恐惧在蔓延。\n> 有人在暗处看着你。`,
            `> 风吹过村子，带来一股烟味。不是炊烟，是别的什么。\n> 你握紧了拳头。`,
            `> 时间一分一秒地过去，你知道历史正在发生。\n> 但你不知道自己的位置在哪里。`
        ];
        const narrative = narratives[Math.floor(Math.random() * narratives.length)];
        // 获取聚光灯NPC（已解锁NPC中第一个）
        const unlockedNPCs = state.npcs.filter((npc) => npc.isUnlocked);
        const spotlightNPC = unlockedNPCs.length > 0 ? unlockedNPCs[0] : null;
        // 基于玩家特质/执念 + NPC行为 + 情境 → 使用AI生成玩家反应
        const context = {
            pressure: state.pressure,
            omega: state.omega,
            weather: state.weather,
            turn: state.turn,
            narrative
        };
        const npcBehavior = {
            type: ['抢夺', '冲突', '偷听', '聊天', '请求', '给予'][Math.floor(Math.random() * 6)],
            description: `${spotlightNPC ? spotlightNPC.name : '有人'}在${state.weather === 'night' ? '黑暗中' : '不远处'}`,
            npcName: spotlightNPC?.name || '陌生人',
            npcTraits: spotlightNPC?.traits?.map((t) => t.id) || [],
            npcObsession: '活下去'
        };
        // 异步生成AI反应
        const reactions = await (0, AIReactionGenerator_1.generatePlayerReactionsWithAI)(state.player, npcBehavior, context);
        // 转换为选择格式
        const choices = reactions.map((r, idx) => ({
            id: r.id,
            text: r.text,
            type: r.type,
            drive: r.drive
        }));
        let result = '';
        if (choice) {
            // 找到选中的反应
            const selectedReaction = reactions.find(r => r.id === choice.id);
            if (selectedReaction) {
                // 应用效果
                if (selectedReaction.effect.fear) {
                    state.player.states.fear = Math.max(1, Math.min(20, state.player.states.fear + selectedReaction.effect.fear));
                }
                if (selectedReaction.effect.aggression) {
                    state.player.states.aggression = Math.max(1, Math.min(20, state.player.states.aggression + selectedReaction.effect.aggression));
                }
                if (selectedReaction.effect.hunger) {
                    state.player.states.hunger = Math.max(1, Math.min(20, state.player.states.hunger + selectedReaction.effect.hunger));
                }
                if (selectedReaction.effect.injury) {
                    state.player.states.injury = Math.max(1, Math.min(20, state.player.states.injury + selectedReaction.effect.injury));
                }
                result = `你${selectedReaction.text}。`;
            }
            else {
                result = '你做出了选择，等待结果...';
            }
            state.history.push({
                turn: state.turn,
                choice: choice.text,
                result,
                timestamp: new Date().toISOString()
            });
        }
        // 剧本事件解锁NPC机制 - 基于Ω（历史必然感）
        let unlockedNPCsThisTurn = [];
        const currentOmega = state.omega;
        const previousStoryEvent = state.storyEvent || 0;
        if (currentOmega >= GameConfig_1.NPC_CONFIG.STORY_EVENT_THRESHOLDS.EVENT_4 && previousStoryEvent < 4) {
            // 事件4: 最终阶段（高潮/结局）
            state.storyEvent = 4;
        }
        else if (currentOmega >= GameConfig_1.NPC_CONFIG.STORY_EVENT_THRESHOLDS.EVENT_3 && previousStoryEvent < 3) {
            // 事件3: 解锁剩余NPC + 关键历史人物
            state.storyEvent = 3;
            // 解锁第9-10个NPC
            state.npcs.forEach((npc) => {
                if (npc.unlockStage === 3 && !npc.isUnlocked) {
                    npc.isUnlocked = true;
                    unlockedNPCsThisTurn.push(npc.name);
                }
            });
            // 添加关键历史人物
            GameConfig_1.NPC_CONFIG.HISTORICAL_FIGURES.forEach((name) => {
                state.npcs.push({
                    id: `npc_${Date.now()}_${state.npcs.length + 1}`,
                    name,
                    traits: [],
                    isBonded: true,
                    isUnlocked: true,
                    unlockStage: 3
                });
                unlockedNPCsThisTurn.push(name);
            });
        }
        else if (currentOmega >= GameConfig_1.NPC_CONFIG.STORY_EVENT_THRESHOLDS.EVENT_2 && previousStoryEvent < 2) {
            // 事件2: 解锁第5-8个NPC
            state.storyEvent = 2;
            state.npcs.forEach((npc) => {
                if (npc.unlockStage === 2 && !npc.isUnlocked) {
                    npc.isUnlocked = true;
                    unlockedNPCsThisTurn.push(npc.name);
                }
            });
        }
        if (unlockedNPCsThisTurn.length > 0) {
            result += ` [新角色出现: ${unlockedNPCsThisTurn.join(', ')}]`;
        }
        let gameOver = null;
        if (state.player.states.injury >= 20 || state.player.states.hunger >= 20) {
            gameOver = { type: 'death', reason: state.player.states.injury >= 20 ? '伤势过重' : '饥饿致死' };
            state.isGameOver = true;
        }
        else if (state.turn >= GameConfig_1.GAME_CONFIG.MAX_TURNS) {
            gameOver = { type: 'completed', reason: '金田起义爆发' };
            state.isGameOver = true;
        }
        res.json((0, apiResponse_1.createSuccessResponse)({
            turn: state.turn,
            narrative,
            choices,
            result,
            state: {
                turn: state.turn,
                datetime: state.datetime,
                pressure: state.pressure,
                omega: state.omega,
                weather: state.weather,
                isGameOver: state.isGameOver
            },
            gameOver
        }, requestId));
    }
    catch (error) {
        res.status(500).json((0, apiResponse_1.createErrorResponse)('TURN_EXECUTION_FAILED', error.message || '执行回合失败', undefined, requestId));
    }
});
// 获取历史记录
router.get('/:id/history', (req, res) => {
    const requestId = generateRequestId();
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json((0, apiResponse_1.createErrorResponse)('GAME_NOT_FOUND', '游戏不存在或已结束', undefined, requestId));
    }
    res.json((0, apiResponse_1.createSuccessResponse)(game.state.history, requestId));
});
// 获取 AI Prompt（前端直连 AI 使用）
router.get('/:id/ai-prompt', (req, res) => {
    const requestId = generateRequestId();
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json((0, apiResponse_1.createErrorResponse)('GAME_NOT_FOUND', '游戏不存在或已结束', undefined, requestId));
    }
    const state = game.state;
    const player = state.player;
    const unlockedNPCs = (state.npcs || []).filter((npc) => npc.isUnlocked);
    const spotlightNPC = unlockedNPCs.length > 0 ? unlockedNPCs[0] : null;
    // 构建 prompt（与 EmergentNarrativeEngine 一致）
    const prompt = `
【时间】第${state.turn}/${GameConfig_1.GAME_CONFIG.MAX_TURNS}回合，${new Date(state.datetime).toLocaleString('zh-CN')}

【场】
压强：${Math.round(state.pressure)}/20
历史必然感：${Math.round(state.omega)}/20

【你】
恐惧：${player.states.fear}/20
攻击性：${player.states.aggression}/20
饥饿：${player.states.hunger}/20
伤势：${player.states.injury}/20
执念：${player.obsession}

【在场者】${spotlightNPC ? spotlightNPC.name : '无'}
${spotlightNPC ? `恐惧：${spotlightNPC.states?.fear || 6}/20
攻击性：${spotlightNPC.states?.aggression || 4}/20
与你的关系：${spotlightNPC.knot || 6}/20
执念：${spotlightNPC.obsession || '活下去'}` : ''}

【约束】
- 从视觉、听觉、嗅觉写环境，不解释"压强高"是什么意思
- 让${spotlightNPC ? spotlightNPC.name : '环境'}的执念自然流露，不直接说"他想..."
- 200字，第二人称，暗示而非说明
`;
    // AI 提供商配置 - 使用统一配置
    const defaultProvider = GameConfig_1.AI_CONFIG.DEFAULT_PROVIDER;
    const provider = GameConfig_1.AI_CONFIG.PROVIDERS[defaultProvider];
    res.json((0, apiResponse_1.createSuccessResponse)({
        prompt,
        provider: defaultProvider,
        model: provider.defaultModel,
        apiUrl: provider.apiUrl
    }, requestId));
});
// 结束游戏
router.delete('/:id', (req, res) => {
    const requestId = generateRequestId();
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json((0, apiResponse_1.createErrorResponse)('GAME_NOT_FOUND', '游戏不存在', undefined, requestId));
    }
    games.delete(req.params.id);
    res.json((0, apiResponse_1.createSuccessResponse)(null, requestId));
});
exports.default = router;
//# sourceMappingURL=games.js.map