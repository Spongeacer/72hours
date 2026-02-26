"use strict";
/**
 * 统一响应格式的 games 路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validateRequest_1 = require("../middleware/validateRequest");
const apiResponse_1 = require("../utils/apiResponse");
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
        const identities = {
            scholar: { name: '村中的读书人', baseMass: 3 },
            landlord: { name: '金田村的地主', baseMass: 6 },
            soldier: { name: '官府的士兵', baseMass: 5 },
            cultist: { name: '教会的受众', baseMass: 4 }
        };
        const player = {
            id: `player_${Date.now()}`,
            name: '你',
            identityType: identity,
            identity: identities[identity],
            traits: [{ id: 'calm', type: 'personality' }, { id: 'curious', type: 'personality' }],
            obsession: '在乱世中活下去',
            states: { fear: 6, aggression: 4, hunger: 8, injury: 1 },
            position: { x: 0, y: 0 }
        };
        const bondedNPCs = [
            { id: `npc_${Date.now()}_1`, name: '母亲', traits: [], isBonded: true, isUnlocked: true },
            { id: `npc_${Date.now()}_2`, name: '教书先生', traits: [], isBonded: true, isUnlocked: true }
        ];
        const gameState = {
            turn: 0,
            datetime: new Date('1851-01-08T00:00:00').toISOString(),
            pressure: 2, // 1-20范围，初始2
            omega: 4, // 1-20范围，初始4
            weather: 'night',
            player,
            npcs: bondedNPCs,
            history: [],
            isGameOver: false
        };
        games.set(gameId, { id: gameId, state: gameState, model: model || 'Pro/MiniMaxAI/MiniMax-M2.5', apiKey });
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
            bondedNPCs: bondedNPCs.map((npc) => ({
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
        current.setHours(current.getHours() + 1);
        state.datetime = current.toISOString();
        // 压强增长 (1-20范围)
        state.pressure = Math.min(20, state.pressure + 0.16);
        // Ω增长 (1-20范围)
        if (state.pressure >= 12) {
            state.omega = Math.min(20, state.omega * 1.02);
        }
        else {
            state.omega = Math.min(20, state.omega + 0.08);
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
        const choices = [
            { id: 'explore', text: '探索周围环境', type: 'normal' },
            { id: 'rest', text: '找个地方休息', type: 'normal' },
            { id: 'observe', text: '观察附近的人', type: 'normal' }
        ];
        if (state.player.states.fear > 12) { // 1-20范围，12对应原60
            choices.push({ id: 'flee', text: '逃离这个危险的地方', type: 'hidden' });
        }
        let result = '';
        if (choice) {
            switch (choice.id) {
                case 'explore':
                    state.player.states.hunger = Math.min(20, state.player.states.hunger + 1);
                    result = '你在村子里走了一圈，发现了一些有趣的东西。';
                    break;
                case 'rest':
                    state.player.states.fear = Math.max(1, state.player.states.fear - 2);
                    state.player.states.hunger = Math.min(20, state.player.states.hunger + 2);
                    result = '你休息了一会儿，感觉稍微平静了一些。';
                    break;
                case 'observe':
                    result = '你观察着周围的人，试图理解这个混乱的夜晚。';
                    break;
                case 'flee':
                    state.player.position.x += 2;
                    state.player.states.fear = Math.max(1, state.player.states.fear - 4);
                    result = '你决定离开这个危险的地方。';
                    break;
                default:
                    result = '你做出了选择，等待结果...';
            }
            state.history.push({
                turn: state.turn,
                choice: choice.text,
                result,
                timestamp: new Date().toISOString()
            });
        }
        let gameOver = null;
        if (state.player.states.injury >= 20 || state.player.states.hunger >= 20) {
            gameOver = { type: 'death', reason: state.player.states.injury >= 20 ? '伤势过重' : '饥饿致死' };
            state.isGameOver = true;
        }
        else if (state.turn >= 72) {
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
    const npcs = state.npcs || [];
    const spotlightNPC = npcs.length > 0 ? npcs[0] : null;
    // 构建 prompt（与 EmergentNarrativeEngine 一致）
    const prompt = `
【时间】第${state.turn}/72回合，${new Date(state.datetime).toLocaleString('zh-CN')}

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
    res.json((0, apiResponse_1.createSuccessResponse)({
        prompt,
        model: game.model || 'Pro/MiniMaxAI/MiniMax-M2.5',
        apiUrl: 'https://api.siliconflow.cn/v1/chat/completions'
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