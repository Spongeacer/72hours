/**
 * AI 提供商工厂
 * 统一管理 AI 实例创建
 */

const { SiliconFlowAI } = require('./SiliconFlowAI');
const { MockAIProvider } = require('./MockAIProvider');

class AIProviderFactory {
  /**
   * 创建 AI 提供商实例
   * @param {string} type - 提供商类型: 'siliconflow' | 'mock'
   * @param {Object} options - 配置选项
   * @returns {IAIProvider} AI 提供商实例
   */
  static create(type, options = {}) {
    switch (type) {
      case 'siliconflow':
        return new SiliconFlowAI(options.apiKey, options.model);
      
      case 'mock':
        return new MockAIProvider(options);
      
      default:
        throw new Error(`未知的 AI 提供商类型: ${type}`);
    }
  }

  /**
   * 根据环境自动创建
   * @param {Object} options - 配置选项
   * @returns {IAIProvider} AI 提供商实例
   */
  static createFromEnv(options = {}) {
    const apiKey = options.apiKey || process.env.SILICONFLOW_API_KEY;
    
    if (apiKey) {
      return this.create('siliconflow', { ...options, apiKey });
    }
    
    console.warn('未配置 AI API Key，使用 Mock 提供商');
    return this.create('mock', options);
  }
}

module.exports = { AIProviderFactory };
