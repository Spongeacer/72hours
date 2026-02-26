/**
 * AI 提供商接口定义
 * 所有 AI 实现必须遵循此接口
 */

class IAIProvider {
  /**
   * 生成叙事文本
   * @param {Object} context - 游戏上下文
   * @returns {Promise<string>} 叙事文本
   */
  async generateNarrative(context) {
    return '';
  }

  /**
   * 生成选择
   * @param {Object} context - 游戏上下文
   * @returns {Promise<Array>} 选择数组
   */
  async generateChoices(context) {
    return [];
  }

  /**
   * 生成结果
   * @param {Object} context - 游戏上下文
   * @param {Object} choice - 玩家选择
   * @returns {Promise<Object>} 结果对象
   */
  async generateResult(context, choice) {
    return {};
  }

  /**
   * 生成后续叙事
   * @param {Object} context - 游戏上下文
   * @returns {Promise<string>} 后续叙事
   */
  async generateFollowUp(context) {
    return '';
  }

  /**
   * 生成角色信息
   * @param {string} identity - 身份类型
   * @param {Array} traits - 特质数组
   * @returns {Promise<Object>} 角色信息
   */
  async generateCharacter(identity, traits) {
    return {};
  }

  /**
   * 通用文本生成
   * @param {string} prompt - 提示词
   * @returns {Promise<string>} 生成的文本
   */
  async generateText(prompt) {
    return '';
  }

  /**
   * 流式生成叙事
   * @param {Object} context - 游戏上下文
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<Object>} 包含 narrative 和 choices 的对象
   */
  async generateNarrativeStream(context, onChunk) {
    const narrative = await this.generateNarrative(context);
    const choices = await this.generateChoices(context);
    return { narrative, choices };
  }

  /**
   * 流式生成结果
   * @param {Object} context - 游戏上下文
   * @param {Object} choice - 玩家选择
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<Object>} 包含 result 和 followUpNarrative 的对象
   */
  async generateResultStream(context, choice, onChunk) {
    const result = await this.generateResult(context, choice);
    return { result, followUpNarrative: '' };
  }
}

module.exports = { IAIProvider };
