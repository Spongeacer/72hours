"use strict";
/**
 * Agent 基类 - 玩家和NPC的抽象基类
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
class Agent {
    constructor(data) {
        // 质量相关
        this.storyMass = 0;
        this.objectMass = 0;
        this.trapConstant = 0;
        // 关系网络 (Knot Map)
        this.knotMap = new Map();
        // 记忆
        this.memories = [];
        // 物品
        this.inventory = [];
        this.id = data.id || this.generateId();
        this.name = data.name;
        this.baseMass = data.baseMass;
        this.traits = data.traits || [];
        this.states = {
            fear: 50,
            aggression: 50,
            hunger: 50,
            injury: 0,
            ...data.states
        };
        this.position = data.position || { x: 0, y: 0 };
    }
    /**
     * 生成唯一ID
     */
    generateId() {
        return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取总质量
     */
    getTotalMass() {
        let knotMass = 0;
        this.knotMap.forEach((value) => {
            knotMass += value * 0.5;
        });
        return this.baseMass + this.storyMass + knotMass + this.objectMass;
    }
    /**
     * 获取有效质量（考虑陷阱）
     */
    getEffectiveMass() {
        return this.getTotalMass() * (1 + this.trapConstant);
    }
    /**
     * 更新K值（关系强度）
     */
    updateKnot(targetId, delta) {
        const current = this.knotMap.get(targetId) || 0;
        const newValue = Math.max(-10, Math.min(10, current + delta));
        if (newValue === 0) {
            this.knotMap.delete(targetId);
        }
        else {
            this.knotMap.set(targetId, newValue);
        }
    }
    /**
     * 获取与某对象的K值
     */
    getKnotWith(targetId) {
        return this.knotMap.get(targetId) || 0;
    }
    /**
     * 检查是否有某特质
     */
    hasTrait(traitId) {
        return this.traits.some(t => t.id === traitId);
    }
    /**
     * 添加记忆
     */
    addMemory(memory) {
        this.memories.push(memory);
        // 限制记忆数量
        if (this.memories.length > 50) {
            this.memories.shift();
        }
    }
    /**
     * 获取与某对象的记忆
     */
    getMemoriesWith(targetId) {
        return this.memories.filter(m => m.npcId === targetId);
    }
    /**
     * 检查是否有背叛记忆
     */
    hasBetrayalMemory(targetId) {
        return this.memories.some(m => m.npcId === targetId && m.type === 'betrayal');
    }
    /**
     * 更新状态
     */
    updateState(key, delta) {
        const newValue = this.states[key] + delta;
        this.states[key] = Math.max(0, Math.min(100, newValue));
    }
    /**
     * 检查是否死亡
     */
    checkDeath() {
        return this.states.injury >= 100 || this.states.hunger >= 100;
    }
    /**
     * 序列化
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            baseMass: this.baseMass,
            traits: this.traits,
            states: this.states,
            position: this.position,
            storyMass: this.storyMass,
            objectMass: this.objectMass,
            trapConstant: this.trapConstant,
            knotMap: Array.from(this.knotMap.entries()),
            memories: this.memories,
            inventory: this.inventory
        };
    }
    /**
     * 反序列化
     */
    static deserialize(data) {
        throw new Error('子类必须实现反序列化方法');
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map