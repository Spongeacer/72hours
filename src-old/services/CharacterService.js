/**
 * 角色服务
 * 封装角色生成和管理逻辑
 */

const { CharacterGenerator } = require('../utils/CharacterGenerator');
const { AIProviderFactory } = require('../narrative/AIProviderFactory');
const { getConfig } = require('../config');

class CharacterService {
  constructor(aiProvider = null) {
    this.aiProvider = aiProvider;
    this.generator = null;
    
    if (aiProvider) {
      this.generator = new CharacterGenerator(aiProvider);
    }
  }

  /**
   * 生成角色
   * @param {string} identity - 身份类型
   * @param {Array} traits - 特质数组
   * @returns {Promise<Object>} 角色信息
   */
  async generate(identity, traits = []) {
    // 如果没有 AI，使用默认生成
    if (!this.generator) {
      return this._generateDefault(identity, traits);
    }

    try {
      // 使用 AI 生成
      const character = await this.generator.generateCharacter(identity, traits);
      
      // 验证必要字段
      return this._validateCharacter(character, identity, traits);
    } catch (error) {
      console.error('AI 生成角色失败，使用默认:', error);
      return this._generateDefault(identity, traits);
    }
  }

  /**
   * 批量生成 NPC
   * @param {number} count - 数量
   * @param {Array} identities - 可选身份列表
   * @returns {Promise<Array>} NPC 数组
   */
  async generateNPCs(count, identities = ['refugee', 'merchant', 'farmer']) {
    const npcs = [];
    
    for (let i = 0; i < count; i++) {
      const identity = identities[Math.floor(Math.random() * identities.length)];
      const npc = await this.generate(identity, []);
      npcs.push(npc);
    }
    
    return npcs;
  }

  /**
   * 生成默认角色
   * @private
   */
  _generateDefault(identity, traits) {
    const defaults = {
      scholar: {
        name: '周文远',
        age: 28,
        backstory: '你是村里唯一的私塾先生。父亲生前也是读书人，留下这间漏雨的茅屋和半箱线装书。',
        startingLocation: '村东头的私塾茅屋',
        items: ['线装书', '毛笔', '半块干粮'],
        relations: [{ name: '母亲', relation: '同住' }],
        secret: '你其实不相信拜上帝会能成功'
      },
      landlord: {
        name: '陈德厚',
        age: 45,
        backstory: '祖上三代积攒下三十亩良田。你是村里最大的地主，人称"陈老爷"。',
        startingLocation: '村西的青砖大院',
        items: ['地契', '银两', '玉扳指'],
        relations: [{ name: '老管家', relation: '心腹' }],
        secret: '你的地契其实是伪造的'
      },
      soldier: {
        name: '李铁柱',
        age: 32,
        backstory: '农家子，十五岁被拉伕充军，在绿营里混了十七年。',
        startingLocation: '村外的破庙',
        items: ['腰刀', '密令', '火折子'],
        relations: [{ name: '同袍小李', relation: '战友' }],
        secret: '你想活着回去见没见过面的儿子'
      },
      cultist: {
        name: '杨阿福',
        age: 24,
        backstory: '三年前父亲被官府逼死，你流浪到金田，是王叔引你入的教。',
        startingLocation: '村中的教会据点',
        items: ['十字架', '密信', '干粮'],
        relations: [{ name: '王叔', relation: '引路人' }],
        secret: '你手里有一封洪秀全的亲笔密信'
      }
    };

    const character = defaults[identity] || defaults.scholar;
    
    return {
      ...character,
      identity,
      traits
    };
  }

  /**
   * 验证角色信息
   * @private
   */
  _validateCharacter(character, identity, traits) {
    const required = ['name', 'age', 'backstory', 'startingLocation', 'items', 'relations', 'secret'];
    
    for (const field of required) {
      if (!character[field]) {
        console.warn(`角色缺少字段: ${field}，使用默认值`);
        const defaultChar = this._generateDefault(identity, traits);
        character[field] = defaultChar[field];
      }
    }
    
    // 确保数组字段
    if (!Array.isArray(character.items)) {
      character.items = [];
    }
    if (!Array.isArray(character.relations)) {
      character.relations = [];
    }
    
    character.identity = identity;
    character.traits = traits;
    
    return character;
  }
}

module.exports = { CharacterService };
