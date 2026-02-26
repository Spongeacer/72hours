"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
const games = new Map();
const createGameSchema = zod_1.z.object({
    identity: zod_1.z.enum(['scholar', 'landlord', 'soldier', 'cultist']),
    model: zod_1.z.string().optional(),
    apiKey: zod_1.z.string().optional()
});
router.post('/', (0, validateRequest_1.validateRequest)({ body: createGameSchema }), async (req, res) => {
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
            states: { fear: 30, aggression: 20, hunger: 40, injury: 0 },
            position: { x: 0, y: 0 },
            baseMass: identities[identity].baseMass,
            storyMass: 0,
            objectMass: 0,
            trapConstant: 0,
            getTotalMass: function () { return this.baseMass + this.storyMass + this.objectMass; },
            getEffectiveMass: function () { return this.getTotalMass() * (1 + this.trapConstant); }
        };
        const bondedNPCs = [
            {
                id: `npc_${Date.now()}_1`,
                name: '母亲',
                traits: [],
                isBonded: true,
                position: { x: 1, y: 0 },
                baseMass: 4,
                storyMass: 0,
                trapConstant: 0,
                states: { fear: 20, aggression: 10, hunger: 30, injury: 0 },
                getTotalMass: function () { return this.baseMass + this.storyMass; },
                getEffectiveMass: function () { return this.getTotalMass() * (1 + this.trapConstant); },
                getKnotWith: function () { return 5; },
                knotMap: new Map([['player', 5]]),
                memories: [],
                obsession: '保护家人',
                isUnlocked: true,
                checkUnlock: function () { return true; }
            },
            {
                id: `npc_${Date.now()}_2`,
                name: '教书先生',
                traits: [],
                isBonded: true,
                position: { x: -1, y: 1 },
                baseMass: 3,
                storyMass: 0,
                trapConstant: 0,
                states: { fear: 40, aggression: 5, hunger: 20, injury: 0 },
                getTotalMass: function () { return this.baseMass + this.storyMass; },
                getEffectiveMass: function () { return this.getTotalMass() * (1 + this.trapConstant); },
                getKnotWith: function () { return 2; },
                knotMap: new Map([['player', 2]]),
                memories: [],
                obsession: '教书育人',
                isUnlocked: true,
                checkUnlock: function () { return true; }
            }
        ];
        const gameState = {
            turn: 0,
            datetime: new Date('1851-01-08T00:00:00').toISOString(),
            pressure: 10,
            omega: 1.0,
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
        res.status(201).json({
            success: true,
            data: {
                gameId,
                player,
                bondedNPCs,
                opening: openings[identity] || openings.scholar,
                state: gameState
            },
            error: null,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: Math.random().toString(36).substring(2, 15)
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'GAME_INIT_FAILED', message: error.message || '创建游戏失败' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
});
router.get('/:id/state', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'GAME_NOT_FOUND', message: '游戏不存在或已结束' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    res.json({
        success: true,
        data: game.state,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
const executeTurnSchema = zod_1.z.object({
    choice: zod_1.z.object({ id: zod_1.z.string(), text: zod_1.z.string() }).optional()
});
router.post('/:id/turns', (0, validateRequest_1.validateRequest)({ body: executeTurnSchema }), async (req, res) => {
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'GAME_NOT_FOUND', message: '游戏不存在或已结束' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    if (game.state.isGameOver) {
        return res.status(400).json({
            success: false,
            data: null,
            error: { code: 'GAME_ALREADY_OVER', message: '游戏已结束' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    try {
        const { choice } = req.body;
        const state = game.state;
        state.turn++;
        const current = new Date(state.datetime);
        current.setHours(current.getHours() + 1);
        state.datetime = current.toISOString();
        state.pressure += 0.8;
        if (state.pressure >= 60) {
            state.omega = Math.min(5.0, state.omega * 1.05);
        }
        else {
            state.omega += 0.02;
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
            { id: 'explore', text: '探索周围环境' },
            { id: 'rest', text: '找个地方休息' },
            { id: 'observe', text: '观察附近的人' }
        ];
        if (state.player.states.fear > 60) {
            choices.push({ id: 'flee', text: '逃离这个危险的地方', type: 'hidden' });
        }
        let result = '';
        if (choice) {
            switch (choice.id) {
                case 'explore':
                    state.player.states.hunger += 5;
                    result = '你在村子里走了一圈，发现了一些有趣的东西。';
                    break;
                case 'rest':
                    state.player.states.fear = Math.max(0, state.player.states.fear - 10);
                    state.player.states.hunger += 10;
                    result = '你休息了一会儿，感觉稍微平静了一些。';
                    break;
                case 'observe':
                    result = '你观察着周围的人，试图理解这个混乱的夜晚。';
                    break;
                case 'flee':
                    state.player.position.x += 2;
                    state.player.states.fear = Math.max(0, state.player.states.fear - 20);
                    result = '你决定离开这个危险的地方。';
                    break;
                default:
                    result = '你做出了选择，等待结果...';
            }
            state.history.push({ turn: state.turn, choice: choice.text, result, timestamp: new Date().toISOString() });
        }
        let gameOver = null;
        if (state.player.states.injury >= 100 || state.player.states.hunger >= 100) {
            gameOver = { type: 'death', reason: state.player.states.injury >= 100 ? '伤势过重' : '饥饿致死' };
            state.isGameOver = true;
        }
        else if (state.turn >= 72) {
            gameOver = { type: 'completed', reason: '金田起义爆发' };
            state.isGameOver = true;
        }
        res.json({
            success: true,
            data: { turn: state.turn, narrative, choices, result, state, gameOver },
            error: null,
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'TURN_EXECUTION_FAILED', message: error.message || '执行回合失败' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
});
router.get('/:id/history', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'GAME_NOT_FOUND', message: '游戏不存在或已结束' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    res.json({
        success: true,
        data: game.state.history,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
router.delete('/:id', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'GAME_NOT_FOUND', message: '游戏不存在' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    games.delete(req.params.id);
    res.json({
        success: true,
        data: null,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
exports.default = router;
//# sourceMappingURL=games.js.map