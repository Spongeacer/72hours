"use strict";
/**
 * Player 玩家类
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const Agent_1 = require("./Agent");
const Constants_1 = require("../utils/Constants");
class Player extends Agent_1.Agent {
    constructor(identityType = 'scholar') {
        const identity = Constants_1.GAME_CONFIG.IDENTITIES[identityType.toUpperCase()];
        super({
            name: '你',
            baseMass: identity.baseMass,
            states: identity.initialStates
        });
        this.isPlayer = true;
        // 执念
        this.obsession = '在乱世中活下去';
        // 关联NPC
        this.bondedNPCs = [];
        // 游戏状态
        this.escaped = false;
        this.captured = false;
        this.identityType = identityType;
        this.identity = identity;
        this.position = { x: 0, y: 0 }; // 玩家始终在原点
    }
    /**
     * 生成执念数据（供AI生成使用）
     */
    generateObsession() {
        const personalityTraits = this.traits
            .filter(t => t.type === 'personality')
            .map(t => t.id);
        if (personalityTraits.length === 0) {
            personalityTraits.push('calm', 'curious');
        }
        const traitsDesc = personalityTraits
            .map(t => {
            const traitInfo = Constants_1.GAME_CONFIG.PERSONALITY_TRAITS[t];
            return traitInfo ? `${t}(${traitInfo.name})` : t;
        })
            .join('、');
        this.obsession = {
            type: 'dynamic',
            identity: this.identityType,
            identityName: this.identity.name,
            traits: personalityTraits,
            traitsDesc: traitsDesc,
            prompt: `生成一个${this.identity.name}的执念，该角色具有以下特质：${traitsDesc}。执念应该体现这些特质，与1851年金田起义的历史背景相关，简洁有力（15字以内）。`
        };
        return this.obsession;
    }
    /**
     * 设置执念文本（由AI生成后调用）
     */
    setObsessionText(text) {
        this.obsession = text;
    }
    /**
     * 获取性格特质列表（用于显示）
     */
    getPersonalityTraits() {
        return this.traits
            .filter(t => t.type === 'personality')
            .map(t => {
            const traitInfo = Constants_1.GAME_CONFIG.PERSONALITY_TRAITS[t.id];
            return traitInfo ? traitInfo.name : t.id;
        });
    }
    /**
     * 获取特质描述字符串
     */
    getTraitsDescription() {
        const traits = this.getPersonalityTraits();
        return traits.length > 0 ? traits.join(' · ') : '';
    }
    /**
     * 添加关联NPC
     */
    addBondedNPC(npc) {
        this.bondedNPCs.push(npc);
        // 设置初始K值
        this.updateKnot(npc.id, npc.initialKnot || 2);
        npc.updateKnot(this.id, npc.initialKnot || 2);
    }
    /**
     * 获取关联NPC
     */
    getBondedNPCs() {
        return this.bondedNPCs;
    }
    /**
     * 获取压强调制系数
     */
    getPressureModifier() {
        return this.identity.pressureModifier || 1.0;
    }
    /**
     * 检查逃离
     */
    checkEscape() {
        return this.escaped ||
            (this.states.fear >= 100 && this.position.x > 5);
    }
    /**
     * 获取玩家状态描述
     */
    getAura() {
        const states = this.states;
        if (states.fear > 70)
            return '恐惧的颤抖';
        if (states.aggression > 70)
            return '压抑的愤怒';
        if (states.hunger > 70)
            return '饥饿的虚弱';
        if (states.injury > 50)
            return '带伤的疲惫';
        return '沉默的警惕';
    }
    /**
     * 获取身份描述
     */
    getIdentityDescription() {
        return this.identity.name;
    }
    /**
     * 序列化
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            identityType: this.identityType,
            identity: this.identity,
            traits: this.traits,
            obsession: typeof this.obsession === 'string' ? this.obsession : this.obsession.prompt,
            states: this.states,
            position: this.position,
            bondedNPCs: this.bondedNPCs.map(npc => npc.id),
            inventory: this.inventory,
            memories: this.memories
        };
    }
    /**
     * 创建玩家（用于反序列化）
     */
    static create(data) {
        const player = new Player(data.identityType || 'scholar');
        if (data.id)
            player.id = data.id;
        if (data.name)
            player.name = data.name;
        if (data.traits)
            player.traits = data.traits;
        if (data.obsession)
            player.obsession = data.obsession;
        if (data.states)
            player.states = { ...player.states, ...data.states };
        if (data.position)
            player.position = data.position;
        if (data.inventory)
            player.inventory = data.inventory;
        if (data.memories)
            player.memories = data.memories;
        return player;
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map