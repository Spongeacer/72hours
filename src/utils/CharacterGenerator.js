/**
 * 角色生成器 - 使用 AI 生成角色背景
 */

const CHARACTER_GENERATION_PROMPT = `你是《72Hours》的角色生成器。
根据玩家选择的身份，生成一个独特的角色背景。

【身份】{identity}
【随机特质】{traits}

【要求】
1. 生成一个具体的人物：
   - 姓名（符合时代背景，1851年清末）
   - 年龄（20-50岁之间）
   - 简要背景故事（2-3段，包含：从哪来、为什么在金田、现在的处境）

2. 生成起始信息：
   - 起始地点（具体位置，如"村东头的破庙"）
   - 随身物品（2-3件具体物品）
   - 关系网络（1-2个关联NPC，说明关系）

3. 生成一个秘密或内心矛盾：
   - 角色知道但不愿让人知道的事
   - 或者角色内心的挣扎/恐惧

【风格要求】
- 粗粝、留白、时代感
- 不解释心理，只呈现事实
- 使用第二人称"你"
- 100-150字的故事，简洁有力

【输出格式】（JSON）
{
  "name": "姓名",
  "age": 年龄,
  "backstory": "背景故事（2-3段，用\\n分隔）",
  "startingLocation": "起始地点",
  "items": ["物品1", "物品2", "物品3"],
  "relations": [
    {"name": "NPC名", "relation": "关系描述"}
  ],
  "secret": "秘密或内心矛盾"
}`;

class CharacterGenerator {
  constructor(aiInterface) {
    this.ai = aiInterface;
  }

  /**
   * 生成角色信息
   * @param {string} identity - 身份类型 (scholar/landlord/soldier/cultist)
   * @param {Array} traits - 特质数组
   * @returns {Promise<Object>} 角色信息
   */
  async generateCharacter(identity, traits = []) {
    if (!this.ai) {
      // 如果没有AI接口，返回默认角色
      return this.getDefaultCharacter(identity);
    }

    const identityNames = {
      scholar: '村中的读书人',
      landlord: '金田村的地主',
      soldier: '官府的士兵',
      cultist: '教会的会众'
    };

    const traitsText = traits.map(t => t.name).join('、') || '无';
    
    const prompt = CHARACTER_GENERATION_PROMPT
      .replace('{identity}', identityNames[identity] || identity)
      .replace('{traits}', traitsText);

    try {
      const response = await this.ai.generateText(prompt);
      
      // 尝试解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const character = JSON.parse(jsonMatch[0]);
        return {
          ...character,
          identity: identity,
          traits: traits
        };
      }
      
      // 解析失败，返回默认角色
      return this.getDefaultCharacter(identity);
    } catch (error) {
      console.error('生成角色失败:', error);
      return this.getDefaultCharacter(identity);
    }
  }

  /**
   * 获取默认角色（备用）
   */
  getDefaultCharacter(identity) {
    const defaults = {
      scholar: {
        name: '周文远',
        age: 28,
        backstory: '你是村里唯一的私塾先生。父亲生前也是读书人，留下这间漏雨的茅屋和半箱线装书。你靠教村里孩子识字、替人写书信维生。你认识洪秀全——他去年曾在村里传教。你觉得他的"天下一家"说得太美，美得不真实。',
        startingLocation: '村东头的私塾茅屋',
        items: ['线装书', '毛笔', '半块干粮'],
        relations: [
          { name: '母亲', relation: '同住，相依为命' },
          { name: '教书先生', relation: '父亲的旧识，偶尔来往' }
        ],
        secret: '你其实不相信拜上帝会能成功，但你羡慕他们的信念'
      },
      landlord: {
        name: '陈德厚',
        age: 45,
        backstory: '祖上三代积攒下三十亩良田。你是村里最大的地主，人称"陈老爷"。你为人不算刻薄，收租时总会给困难户宽限几日。但你知道，有人恨你——韦昌辉，那个被你拒婚的小地主儿子，如今在拜上帝会里很有地位。',
        startingLocation: '村西的青砖大院',
        items: ['地契', '银两', '玉扳指'],
        relations: [
          { name: '老管家', relation: '心腹，跟了陈家二十年' },
          { name: '佃户老张', relation: '租户，老实巴交的农民' }
        ],
        secret: '你的地契其实是伪造的，真正的地契在县城当铺里'
      },
      soldier: {
        name: '李铁柱',
        age: 32,
        backstory: '农家子，十五岁被拉伕充军，在绿营里混了十七年。你杀过人——上个月在隔壁村子，你们"剿匪"时杀了三个"会匪"，其中一个是少年。你夜里会梦见他的眼睛。这次奉命潜入金田打探虚实。',
        startingLocation: '村外的破庙（临时藏身）',
        items: ['腰刀', '密令', '火折子'],
        relations: [
          { name: '父亲', relation: '在老家，年迈体弱' },
          { name: '同袍小李', relation: '战友，唯一信得过的人' }
        ],
        secret: '你想活着回去见没见过面的儿子，哪怕当逃兵'
      },
      cultist: {
        name: '杨阿福',
        age: 24,
        backstory: '三年前父亲被官府逼死，你流浪到金田，是王叔引你入的教。你说不清拜上帝和拜菩萨有什么区别，但在这里，你第一次感到被接纳。你知道起义的日期——十一月十一日，万寿节。',
        startingLocation: '村中的教会据点（王叔家）',
        items: ['十字架', '密信', '干粮'],
        relations: [
          { name: '王叔', relation: '引路人，像父亲一样的人' },
          { name: '兄长', relation: '教友，一起入教的伙伴' }
        ],
        secret: '你手里有一封洪秀全的亲笔密信，如果落到官兵手里你就死定了'
      }
    };

    return {
      ...defaults[identity],
      identity: identity,
      traits: []
    };
  }
}

module.exports = { CharacterGenerator };
