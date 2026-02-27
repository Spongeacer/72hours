/**
 * BackgroundManager - 背景管理器
 * 管理可拔插的故事背景
 */

import { IStoryBackground } from './interfaces/IStoryBackground';
import { TaipingBackground } from './backgrounds/TaipingBackground';

export class BackgroundManager {
  private backgrounds: Map<string, IStoryBackground> = new Map();
  private currentBackground: IStoryBackground | null = null;
  
  constructor() {
    // 注册默认背景
    this.registerBackground(new TaipingBackground());
  }
  
  /**
   * 注册背景
   */
  registerBackground(background: IStoryBackground): void {
    this.backgrounds.set(background.id, background);
    console.log(`[BackgroundManager] 注册背景: ${background.name} (${background.id})`);
  }
  
  /**
   * 获取背景
   */
  getBackground(id: string): IStoryBackground | null {
    return this.backgrounds.get(id) || null;
  }
  
  /**
   * 设置当前背景
   */
  setCurrentBackground(id: string): boolean {
    const bg = this.backgrounds.get(id);
    if (bg) {
      this.currentBackground = bg;
      console.log(`[BackgroundManager] 当前背景: ${bg.name}`);
      return true;
    }
    console.error(`[BackgroundManager] 背景不存在: ${id}`);
    return false;
  }
  
  /**
   * 获取当前背景
   */
  getCurrentBackground(): IStoryBackground | null {
    return this.currentBackground;
  }
  
  /**
   * 列出所有可用背景
   */
  listBackgrounds(): { id: string; name: string; description: string }[] {
    return Array.from(this.backgrounds.values()).map(bg => ({
      id: bg.id,
      name: bg.name,
      description: bg.description
    }));
  }
  
  /**
   * 加载外部背景（动态加载）
   */
  async loadExternalBackground(path: string): Promise<boolean> {
    try {
      // 动态导入背景模块
      const module = await import(path);
      const BackgroundClass = module.default || module[Object.keys(module)[0]];
      
      if (BackgroundClass && typeof BackgroundClass === 'function') {
        const instance = new BackgroundClass();
        if (this.validateBackground(instance)) {
          this.registerBackground(instance);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`[BackgroundManager] 加载外部背景失败: ${path}`, error);
      return false;
    }
  }
  
  /**
   * 验证背景接口
   */
  private validateBackground(bg: unknown): bg is IStoryBackground {
    const required = ['id', 'name', 'description', 'startDate', 'totalTurns'];
    const bgRecord = bg as Record<string, unknown>;
    for (const key of required) {
      if (!(key in bgRecord)) {
        console.error(`[BackgroundManager] 背景缺少必需属性: ${key}`);
        return false;
      }
    }
    return true;
  }
}

// 单例实例
export const backgroundManager = new BackgroundManager();
export default BackgroundManager;
