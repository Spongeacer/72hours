/**
 * 时间推进系统 - 优化游戏内时间流逝
 * 基于 DESIGN.md：前期慢节奏，后期快节奏
 */

const { GAME_CONFIG } = require('../utils/Constants');

class TimeProgressionSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 时间推进配置
    this.progressionConfig = {
      early: {
        turns: [1, 24],
        hoursPerTurn: 1,      // 前期：每回合1小时
        description: '慢节奏，细致描写'
      },
      mid: {
        turns: [25, 48],
        hoursPerTurn: 1.5,    // 中期：每回合1.5小时
        description: '节奏加快，紧张感增强'
      },
      late: {
        turns: [49, 66],
        hoursPerTurn: 2,      // 后期：每回合2小时
        description: '快节奏，大势已去'
      },
      final: {
        turns: [67, 72],
        hoursPerTurn: 4,      // 最终阶段：每回合4小时
        description: '极速推进，命运揭晓'
      }
    };
    
    // 累计时间偏移（用于处理小数小时）
    this.timeOffset = 0;
    
    // 特殊时间点（历史锚点）
    this.anchorPoints = {
      1: { hour: 1, description: '凌晨，暗流涌动' },
      24: { hour: 24, description: '第24回合，官兵搜查锚点' },
      48: { hour: 48, description: '第48回合，天父下凡锚点' },
      71: { hour: 71, description: '第71回合，万寿祝寿' },
      72: { hour: 72, description: '第72回合，金田起义' }
    };
  }
  
  /**
   * 获取当前阶段配置
   */
  getStageConfig(turn) {
    for (const [stage, config] of Object.entries(this.progressionConfig)) {
      if (turn >= config.turns[0] && turn <= config.turns[1]) {
        return { stage, ...config };
      }
    }
    return { stage: 'final', ...this.progressionConfig.final };
  }
  
  /**
   * 计算时间推进
   * 返回本回合应该推进的小时数
   */
  calculateTimeProgression(turn, isAnchorTurn = false) {
    // 如果是锚点回合，精确控制时间
    if (isAnchorTurn && this.anchorPoints[turn]) {
      return this.anchorPoints[turn].hour - this.getCurrentHour(turn - 1);
    }
    
    const config = this.getStageConfig(turn);
    return config.hoursPerTurn;
  }
  
  /**
   * 计算游戏内时间（优化版）
   * 考虑不同阶段的时间推进速度
   */
  calculateGameTime(turn) {
    const baseDate = new Date('1851-01-08T00:00:00');
    let totalHours = 0;
    
    // 计算前turn-1回合累计的时间
    for (let t = 1; t < turn; t++) {
      totalHours += this.calculateTimeProgression(t);
    }
    
    // 添加时间偏移
    totalHours += this.timeOffset;
    
    // 设置时间
    baseDate.setHours(baseDate.getHours() + Math.floor(totalHours));
    baseDate.setMinutes((totalHours % 1) * 60);
    
    return baseDate;
  }
  
  /**
   * 获取当前小时数（相对于游戏开始）
   */
  getCurrentHour(turn) {
    let totalHours = 0;
    for (let t = 1; t <= turn; t++) {
      totalHours += this.calculateTimeProgression(t);
    }
    return totalHours;
  }
  
  /**
   * 获取时间推进描述
   */
  getTimeProgressionDescription(turn) {
    const config = this.getStageConfig(turn);
    const nextConfig = this.getStageConfig(turn + 1);
    
    // 检查是否进入新阶段
    if (config.stage !== nextConfig.stage) {
      return {
        stageChange: true,
        fromStage: config.stage,
        toStage: nextConfig.stage,
        description: `进入${this.getStageName(nextConfig.stage)}：${nextConfig.description}`,
        hoursPerTurn: nextConfig.hoursPerTurn
      };
    }
    
    return {
      stageChange: false,
      stage: config.stage,
      description: config.description,
      hoursPerTurn: config.hoursPerTurn
    };
  }
  
  /**
   * 获取阶段名称
   */
  getStageName(stage) {
    const names = {
      early: '前期',
      mid: '中期',
      late: '后期',
      final: '最终阶段'
    };
    return names[stage] || stage;
  }
  
  /**
   * 检查是否是锚点回合
   */
  isAnchorTurn(turn) {
    return !!this.anchorPoints[turn];
  }
  
  /**
   * 获取锚点信息
   */
  getAnchorInfo(turn) {
    return this.anchorPoints[turn] || null;
  }
  
  /**
   * 生成时间叙事提示
   */
  generateTimeNarrativeHint(turn) {
    const progression = this.getTimeProgressionDescription(turn);
    const anchor = this.getAnchorInfo(turn);
    
    let hint = '';
    
    // 阶段变化提示
    if (progression.stageChange) {
      hint += `【时间推进】进入${this.getStageName(progression.toStage)}，`;
      hint += `每回合推进${progression.hoursPerTurn}小时。`;
      hint += `${progression.description}\n`;
    }
    
    // 锚点提示
    if (anchor) {
      hint += `【历史锚点】${anchor.description}\n`;
    }
    
    // 时间紧迫感提示
    const remainingTurns = 72 - turn;
    if (remainingTurns <= 10) {
      hint += `【时间紧迫】还剩${remainingTurns}回合，起义即将爆发。\n`;
    } else if (remainingTurns <= 24) {
      hint += `【时间加速】还剩${remainingTurns}回合，节奏加快。\n`;
    }
    
    return hint || null;
  }
  
  /**
   * 格式化时间显示（优化版）
   */
  formatGameTime(date, includeMinutes = false) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    
    if (includeMinutes) {
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${year}年${month}月${day}日 ${hour}:${minute}`;
    }
    
    return `${year}年${month}月${day}日 ${hour}:00`;
  }
  
  /**
   * 获取时间段描述
   */
  getTimePeriodDescription(hour) {
    if (hour >= 5 && hour < 7) return { name: '黎明', desc: '天刚蒙蒙亮' };
    if (hour >= 7 && hour < 11) return { name: '上午', desc: '阳光渐强' };
    if (hour >= 11 && hour < 13) return { name: '正午', desc: '日头正毒' };
    if (hour >= 13 && hour < 17) return { name: '下午', desc: '日渐西斜' };
    if (hour >= 17 && hour < 19) return { name: '黄昏', desc: '夕阳西下' };
    if (hour >= 19 && hour < 21) return { name: '傍晚', desc: '暮色四合' };
    return { name: '深夜', desc: '万籁俱寂' };
  }
  
  /**
   * 计算天气（基于时间和回合）
   */
  calculateWeather(turn, hour) {
    // 基础天气逻辑
    if (hour >= 6 && hour < 18) return 'clear';
    if (hour >= 20 || hour < 5) return 'night';
    
    // 后期阶段增加恶劣天气概率
    if (turn > 48) {
      const rand = Math.random();
      if (rand < 0.3) return 'fog';
      if (rand < 0.5) return 'rain';
    }
    
    return 'fog';
  }
  
  /**
   * 获取时间统计
   */
  getTimeStats(currentTurn) {
    const gameTime = this.calculateGameTime(currentTurn);
    const currentHour = this.getCurrentHour(currentTurn);
    const stage = this.getStageConfig(currentTurn);
    
    return {
      gameTime,
      currentHour,
      stage: stage.stage,
      hoursPerTurn: stage.hoursPerTurn,
      remainingTurns: 72 - currentTurn,
      estimatedEndHour: currentHour + (72 - currentTurn) * stage.hoursPerTurn
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeProgressionSystem };
}
