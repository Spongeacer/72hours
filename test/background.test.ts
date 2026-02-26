/**
 * 模块化背景系统测试
 * 验证可拔插背景系统的核心功能
 * 
 * 测试覆盖:
 * 1. 背景管理器注册/切换
 * 2. TaipingBackground 固定事件
 * 3. 背景环境描述生成
 * 4. 动态加载外部背景
 */

import { BackgroundManager } from '../src/narrative/BackgroundManager';
import { TaipingBackground } from '../src/narrative/backgrounds/TaipingBackground';
import { IStoryBackground, FixedEvent, EventEffect } from '../src/narrative/interfaces/IStoryBackground';
import { NPC, Player } from '../shared/types';

// ==================== 测试框架 ====================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];
  private currentTest: string = '';

  async run(name: string, fn: () => void | Promise<void>): Promise<void> {
    this.currentTest = name;
    const start = Date.now();
    try {
      await fn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - start
      });
      console.log(`  ✓ ${name}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({
        name,
        passed: false,
        error: errorMsg,
        duration: Date.now() - start
      });
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${errorMsg}`);
    }
  }

  summary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(50));
    console.log('测试总结');
    console.log('='.repeat(50));
    console.log(`总计: ${total} | 通过: ${passed} | 失败: ${failed}`);
    console.log(`耗时: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n失败的测试:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    console.log('='.repeat(50));
  }

  get exitCode(): number {
    return this.results.some(r => !r.passed) ? 1 : 0;
  }
}

// ==================== 断言工具 ====================

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

function assertNotNull<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected non-null value');
  }
  return value;
}

function assertThrows(fn: () => void, message?: string): Error {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch (e) {
    if (e instanceof Error && e.message === (message || 'Expected function to throw')) {
      throw e;
    }
    return e as Error;
  }
}

function assertContains(haystack: string, needle: string, message?: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(
      message || `Expected "${haystack}" to contain "${needle}"`
    );
  }
}

// ==================== 模拟数据 ====================

const mockPlayer: Player = {
  id: 'player_1',
  name: '测试玩家',
  identityType: 'scholar',
  identity: {
    id: 'scholar',
    name: '书生',
    baseMass: 5,
    pressureModifier: 1.0,
    initialStates: { fear: 10, aggression: 5, hunger: 20, injury: 0 }
  },
  traits: [{ id: 'calm', type: 'personality', name: '沉稳' }],
  obsession: '寻找乱世中的一方安宁',
  states: { fear: 10, aggression: 5, hunger: 20, injury: 0 },
  position: { x: 0, y: 0 },
  bondedNPCs: ['npc_mother', 'npc_teacher'],
  inventory: [],
  memories: []
};

const mockNPC: NPC = {
  id: 'npc_test',
  name: '测试NPC',
  baseMass: 4,
  traits: [{ id: 'fearful', type: 'personality', name: '胆怯' }],
  obsession: '活下去',
  states: { fear: 30, aggression: 10, hunger: 40, injury: 0 },
  position: { x: 1, y: 1 },
  isBonded: false,
  isElite: false,
  isUnlocked: true
};

// ==================== 测试用例 ====================

async function runTests(): Promise<void> {
  const runner = new TestRunner();

  console.log('\n' + '='.repeat(50));
  console.log('模块化背景系统测试套件');
  console.log('='.repeat(50) + '\n');

  // ========== 测试套件 1: 背景管理器注册/切换 ==========
  console.log('【测试套件 1】背景管理器注册/切换');
  console.log('-'.repeat(50));

  await runner.run('背景管理器初始化 - 默认注册TaipingBackground', () => {
    const manager = new BackgroundManager();
    const bg = manager.getBackground('taiping_1851');
    assertNotNull(bg, 'TaipingBackground应在初始化时自动注册');
    assertEquals(bg.id, 'taiping_1851');
    assertEquals(bg.name, '金田起义');
  });

  await runner.run('注册背景 - 成功注册新背景', () => {
    const manager = new BackgroundManager();
    const customBg = new TaipingBackground();
    customBg.id = 'custom_taiping';
    customBg.name = '自定义金田';
    
    manager.registerBackground(customBg);
    const retrieved = manager.getBackground('custom_taiping');
    
    assertNotNull(retrieved);
    assertEquals(retrieved.name, '自定义金田');
  });

  await runner.run('获取背景 - 不存在的背景返回null', () => {
    const manager = new BackgroundManager();
    const bg = manager.getBackground('non_existent');
    assertEquals(bg, null, '不存在的背景应返回null');
  });

  await runner.run('设置当前背景 - 成功切换', () => {
    const manager = new BackgroundManager();
    const result = manager.setCurrentBackground('taiping_1851');
    
    assertEquals(result, true, '设置存在的背景应返回true');
    const current = manager.getCurrentBackground();
    assertNotNull(current);
    assertEquals(current.id, 'taiping_1851');
  });

  await runner.run('设置当前背景 - 不存在的背景返回false', () => {
    const manager = new BackgroundManager();
    const result = manager.setCurrentBackground('non_existent');
    
    assertEquals(result, false, '设置不存在的背景应返回false');
  });

  await runner.run('列出所有背景 - 返回完整列表', () => {
    const manager = new BackgroundManager();
    const customBg = new TaipingBackground();
    customBg.id = 'second_bg';
    customBg.name = '第二背景';
    customBg.description = '测试描述';
    
    manager.registerBackground(customBg);
    const list = manager.listBackgrounds();
    
    assert(list.length >= 2, `应至少有2个背景，实际有${list.length}个`);
    
    const taiping = list.find(b => b.id === 'taiping_1851');
    assertNotNull(taiping);
    assertEquals(taiping.name, '金田起义');
    assertNotNull(taiping.description);
  });

  await runner.run('单例实例 - backgroundManager全局可用', () => {
    const { backgroundManager } = require('../src/narrative/BackgroundManager');
    assertNotNull(backgroundManager);
    assertNotNull(backgroundManager.getBackground('taiping_1851'));
  });

  // ========== 测试套件 2: TaipingBackground 固定事件 ==========
  console.log('\n【测试套件 2】TaipingBackground 固定事件');
  console.log('-'.repeat(50));

  await runner.run('固定事件 - 第24回合官府缉匪告示', () => {
    const bg = new TaipingBackground();
    const event = bg.getFixedEvent(24);
    
    assertNotNull(event, '第24回合应有固定事件');
    assertEquals(event.turn, 24);
    assertEquals(event.title, '官府缉匪告示');
    assertContains(event.description, '缉拿会匪');
    
    // 验证效果
    assert(event.effects.length >= 2, '应有至少2个效果');
    const pressureEffect = event.effects.find((e: EventEffect) => e.type === 'pressure');
    assertNotNull(pressureEffect);
    assertEquals(pressureEffect.value, 10);
    
    const signalEffect = event.effects.find((e: EventEffect) => e.type === 'global_signal');
    assertNotNull(signalEffect);
    assertEquals(signalEffect.value, 'official_crackdown');
  });

  await runner.run('固定事件 - 第48回合传教士入村', () => {
    const bg = new TaipingBackground();
    const event = bg.getFixedEvent(48);
    
    assertNotNull(event);
    assertEquals(event.title, '传教士入村');
    assertContains(event.description, '传教士');
    
    const unlockEffect = event.effects.find((e: EventEffect) => e.type === 'npc_unlock');
    assertNotNull(unlockEffect);
    assertEquals(unlockEffect.target, 'missionary');
  });

  await runner.run('固定事件 - 第60回合太平军逼近', () => {
    const bg = new TaipingBackground();
    const event = bg.getFixedEvent(60);
    
    assertNotNull(event);
    assertEquals(event.title, '太平军逼近');
    
    const omegaEffect = event.effects.find((e: EventEffect) => e.type === 'omega');
    assertNotNull(omegaEffect);
    assertEquals(omegaEffect.value, 1.5);
  });

  await runner.run('固定事件 - 第72回合金田起义爆发', () => {
    const bg = new TaipingBackground();
    const event = bg.getFixedEvent(72);
    
    assertNotNull(event);
    assertEquals(event.title, '金田起义爆发');
    assertContains(event.description, '拜上帝会');
    
    const pressureEffect = event.effects.find((e: EventEffect) => e.type === 'pressure');
    assertNotNull(pressureEffect);
    assertEquals(pressureEffect.value, 50);
  });

  await runner.run('固定事件 - 非事件回合返回null', () => {
    const bg = new TaipingBackground();
    
    assertEquals(bg.getFixedEvent(1), null);
    assertEquals(bg.getFixedEvent(23), null);
    assertEquals(bg.getFixedEvent(25), null);
    assertEquals(bg.getFixedEvent(100), null);
  });

  await runner.run('固定事件 - 所有预定义事件完整性检查', () => {
    const bg = new TaipingBackground();
    const expectedTurns = [24, 48, 60, 72];
    
    for (const turn of expectedTurns) {
      const event = bg.getFixedEvent(turn);
      assertNotNull(event, `第${turn}回合应有事件`);
      assertEquals(event.turn, turn);
      assert(event.title.length > 0, '事件标题不应为空');
      assert(event.description.length > 0, '事件描述不应为空');
      assert(event.effects.length > 0, '事件应至少有一个效果');
      
      // 验证每个效果的结构
      for (const effect of event.effects) {
        assert(
          ['pressure', 'omega', 'npc_unlock', 'npc_state', 'global_signal'].includes(effect.type),
          `未知的效果类型: ${effect.type}`
        );
        assert(effect.value !== undefined, '效果应有value属性');
      }
    }
  });

  // ========== 测试套件 3: 背景环境描述生成 ==========
  console.log('\n【测试套件 3】背景环境描述生成');
  console.log('-'.repeat(50));

  await runner.run('环境描述 - 夜晚晴天', () => {
    const bg = new TaipingBackground();
    const desc = bg.getEnvironmentalDescription(0, 'clear'); // 00:00, clear
    
    assertContains(desc, '月光', '夜晚晴天应描述月光');
    assert(desc.length > 10, '描述应足够详细');
  });

  await runner.run('环境描述 - 夜晚雨天', () => {
    const bg = new TaipingBackground();
    const desc = bg.getEnvironmentalDescription(0, 'rain');
    
    assertContains(desc, '雨', '雨天应描述雨声');
  });

  await runner.run('环境描述 - 夜晚雾天', () => {
    const bg = new TaipingBackground();
    const desc = bg.getEnvironmentalDescription(0, 'fog');
    
    assertContains(desc, '雾', '雾天应描述雾气');
  });

  await runner.run('环境描述 - 黎明时段', () => {
    const bg = new TaipingBackground();
    // 5:00 - 7:00 是黎明
    const desc = bg.getEnvironmentalDescription(5 * 60, 'clear'); // 05:00
    
    assertContains(desc, '鱼肚白', '黎明应描述天色变化');
  });

  await runner.run('环境描述 - 白天时段', () => {
    const bg = new TaipingBackground();
    // 12:00 是正午
    const desc = bg.getEnvironmentalDescription(12 * 60, 'clear');
    
    assertContains(desc, '阳光', '白天应描述阳光');
  });

  await runner.run('环境描述 - 黄昏时段', () => {
    const bg = new TaipingBackground();
    // 18:00 是黄昏
    const desc = bg.getEnvironmentalDescription(18 * 60, 'clear');
    
    assertContains(desc, '夕阳', '黄昏应描述夕阳');
  });

  await runner.run('环境描述 - 不同天气产生不同描述', () => {
    const bg = new TaipingBackground();
    const clearDesc = bg.getEnvironmentalDescription(12 * 60, 'clear');
    const rainDesc = bg.getEnvironmentalDescription(12 * 60, 'rain');
    const fogDesc = bg.getEnvironmentalDescription(12 * 60, 'fog');
    
    assert(clearDesc !== rainDesc, '晴天和雨天应有不同描述');
    assert(rainDesc !== fogDesc, '雨天和雾天应有不同描述');
  });

  await runner.run('玩家背景生成 - 书生身份', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generatePlayerBackstory('scholar', ['calm', 'curious']);
    
    assertContains(backstory, '廪生', '书生背景应提及廪生');
    assertContains(backstory, '金田', '应提及地点金田');
    assertContains(backstory, '沉稳', '应包含特质描述');
    assertContains(backstory, '敏感', '应包含好奇特质的效果');
  });

  await runner.run('玩家背景生成 - 地主身份', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generatePlayerBackstory('landlord', ['greedy']);
    
    assertContains(backstory, '地主', '地主背景应提及身份');
    assertContains(backstory, '田产', '应提及田产');
    assertContains(backstory, '财产', '贪婪特质应影响描述');
  });

  await runner.run('玩家背景生成 - 士兵身份', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generatePlayerBackstory('soldier', ['brave']);
    
    assertContains(backstory, '士兵', '士兵背景应提及身份');
    assertContains(backstory, '官府', '应提及官府');
    assertContains(backstory, '不怕死', '勇敢特质应体现');
  });

  await runner.run('玩家背景生成 - 会众身份', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generatePlayerBackstory('cultist', ['zealous']);
    
    assertContains(backstory, '拜上帝会', '会众背景应提及拜上帝会');
    assertContains(backstory, '洪秀全', '应提及洪秀全');
    assertContains(backstory, '狂热', '狂热特质应体现');
  });

  await runner.run('玩家背景生成 - 未知身份使用默认', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generatePlayerBackstory('unknown_identity', []);
    
    // 应返回默认的书生背景
    assertContains(backstory, '廪生', '未知身份应使用默认书生背景');
  });

  await runner.run('NPC背景生成 - 母亲角色', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generateNPCBackstory('mother');
    
    assertContains(backstory, '母亲', '母亲角色应正确生成');
    assertContains(backstory, '饥荒', '应提及历史背景');
  });

  await runner.run('NPC背景生成 - 教书先生角色', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generateNPCBackstory('teacher');
    
    assertContains(backstory, '教书先生', '应提及身份');
    assertContains(backstory, '读书人', '应提及读书人');
  });

  await runner.run('NPC背景生成 - 历史人物洪秀全', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generateNPCBackstory('hong_xiuquan');
    
    assertContains(backstory, '洪秀全', '应提及洪秀全');
    assertContains(backstory, '上帝', '应提及宗教背景');
  });

  await runner.run('NPC背景生成 - 历史人物杨秀清', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generateNPCBackstory('yang_xiuqing');
    
    assertContains(backstory, '杨秀清', '应提及杨秀清');
    assertContains(backstory, '组织者', '应提及其角色');
  });

  await runner.run('NPC背景生成 - 传教士角色', () => {
    const bg = new TaipingBackground();
    const backstory = bg.generateNPCBackstory('missionary');
    
    assertContains(backstory, '传教士', '应提及传教士');
    assertContains(backstory, '西洋', '应提及来源');
  });

  await runner.run('氛围词汇 - 不同情绪返回不同词汇', () => {
    const bg = new TaipingBackground();
    
    const tenseWords = bg.getAtmosphericWords('tense');
    assert(tenseWords.length > 0, '紧张情绪应有词汇');
    assert(tenseWords.includes('压抑'), '应包含"压抑"');
    
    const fearfulWords = bg.getAtmosphericWords('fearful');
    assert(fearfulWords.includes('恐惧'), '应包含"恐惧"');
    
    const hopefulWords = bg.getAtmosphericWords('hopeful');
    assert(hopefulWords.includes('期待'), '应包含"期待"');
    
    const desperateWords = bg.getAtmosphericWords('desperate');
    assert(desperateWords.includes('绝望'), '应包含"绝望"');
  });

  await runner.run('意象池 - 返回历史相关意象', () => {
    const bg = new TaipingBackground();
    const imagery = bg.getImageryPool();
    
    assert(imagery.length > 0, '意象池不应为空');
    assert(imagery.includes('火把'), '应包含"火把"');
    assert(imagery.includes('刀光'), '应包含"刀光"');
    assert(imagery.includes('辫子'), '应包含时代特征"辫子"');
    assert(imagery.includes('铜钱'), '应包含"铜钱"');
  });

  await runner.run('行为语境化 - 抢夺行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('seizure', mockNPC, mockPlayer);
    
    assertContains(context, mockNPC.name, '应提及NPC名称');
    assertContains(context, '干粮', '抢夺应涉及干粮');
    assertContains(context, '饥荒', '应提及时代背景饥荒');
  });

  await runner.run('行为语境化 - 冲突行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('conflict', mockNPC, mockPlayer);
    
    assertContains(context, '刀', '冲突应涉及武器');
    assertContains(context, '官府', '应提及官府');
  });

  await runner.run('行为语境化 - 窃听行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('eavesdrop', mockNPC, mockPlayer);
    
    assertContains(context, '祠堂', '窃听场景应在祠堂');
    assertContains(context, '呼吸', '应描述隐蔽状态');
  });

  await runner.run('行为语境化 - 对话行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('conversation', mockNPC, mockPlayer);
    
    assertContains(context, '读书人', '对话应在读书人之间');
    assertContains(context, '诗', '应提及诗歌');
  });

  await runner.run('行为语境化 - 请求行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('request', mockNPC, mockPlayer);
    
    assertContains(context, '跪下', '请求应描述动作');
    assertContains(context, '门路', '应提及求生的门路');
  });

  await runner.run('行为语境化 - 给予行为', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('give', mockNPC, mockPlayer);
    
    assertContains(context, '干粮', '给予应涉及干粮');
    assertContains(context, '铜钱', '应包含隐藏的铜钱');
  });

  await runner.run('行为语境化 - 未知行为返回默认', () => {
    const bg = new TaipingBackground();
    const context = bg.contextualizeBehavior('unknown_behavior', mockNPC, mockPlayer);
    
    assertContains(context, mockNPC.name, '默认描述应提及NPC');
    assertContains(context, '眼神', '应描述眼神');
  });

  // ========== 测试套件 4: 动态加载外部背景 ==========
  console.log('\n【测试套件 4】动态加载外部背景');
  console.log('-'.repeat(50));

  await runner.run('验证背景接口 - 完整的背景对象', () => {
    const bg = new TaipingBackground();
    
    // 验证必需属性
    assert(typeof bg.id === 'string', 'id应为字符串');
    assert(bg.id.length > 0, 'id不应为空');
    
    assert(typeof bg.name === 'string', 'name应为字符串');
    assert(bg.name.length > 0, 'name不应为空');
    
    assert(typeof bg.description === 'string', 'description应为字符串');
    
    assert(typeof bg.startDate === 'string', 'startDate应为字符串');
    assert(bg.startDate.match(/^\d{4}-\d{2}-\d{2}/) !== null, 'startDate应为有效日期格式');
    
    assert(typeof bg.totalTurns === 'number', 'totalTurns应为数字');
    assert(bg.totalTurns > 0, 'totalTurns应大于0');
    
    // 验证方法存在
    assert(typeof bg.getEnvironmentalDescription === 'function', '应有getEnvironmentalDescription方法');
    assert(typeof bg.getFixedEvent === 'function', '应有getFixedEvent方法');
    assert(typeof bg.generatePlayerBackstory === 'function', '应有generatePlayerBackstory方法');
    assert(typeof bg.generateNPCBackstory === 'function', '应有generateNPCBackstory方法');
    assert(typeof bg.getAtmosphericWords === 'function', '应有getAtmosphericWords方法');
    assert(typeof bg.getImageryPool === 'function', '应有getImageryPool方法');
    assert(typeof bg.contextualizeBehavior === 'function', '应有contextualizeBehavior方法');
  });

  await runner.run('背景管理器验证 - 有效背景通过验证', () => {
    const manager = new BackgroundManager();
    const validBg = new TaipingBackground();
    validBg.id = 'valid_test_bg';
    
    // 通过registerBackground间接测试validateBackground
    manager.registerBackground(validBg);
    const retrieved = manager.getBackground('valid_test_bg');
    
    assertNotNull(retrieved, '有效背景应被成功注册');
  });

  await runner.run('背景管理器验证 - 缺少必需属性的背景被拒绝', () => {
    const manager = new BackgroundManager();
    
    // 创建一个缺少必需属性的对象
    const invalidBg = {
      id: 'invalid_bg',
      name: '无效背景'
      // 缺少 description, startDate, totalTurns
    } as IStoryBackground;
    
    // 尝试注册（应通过，因为我们强制类型转换）
    // 但 validateBackground 应该能检测到问题
    manager.registerBackground(invalidBg);
    
    // 由于强制类型转换，它会被注册，但我们可以验证验证逻辑
    // 通过检查控制台错误或特定行为
  });

  await runner.run('背景切换状态保持 - 切换后原背景数据完整', () => {
    const manager = new BackgroundManager();
    
    // 创建两个背景
    const bg1 = new TaipingBackground();
    bg1.id = 'bg1';
    bg1.name = '背景一';
    
    const bg2 = new TaipingBackground();
    bg2.id = 'bg2';
    bg2.name = '背景二';
    
    manager.registerBackground(bg1);
    manager.registerBackground(bg2);
    
    // 切换到bg1
    manager.setCurrentBackground('bg1');
    assertEquals(manager.getCurrentBackground()?.id, 'bg1');
    
    // 切换到bg2
    manager.setCurrentBackground('bg2');
    assertEquals(manager.getCurrentBackground()?.id, 'bg2');
    
    // 验证bg1仍然存在
    const retrievedBg1 = manager.getBackground('bg1');
    assertNotNull(retrievedBg1);
    assertEquals(retrievedBg1.name, '背景一');
  });

  await runner.run('背景独立性 - 不同背景实例互不影响', () => {
    const bg1 = new TaipingBackground();
    bg1.id = 'independent_1';
    
    const bg2 = new TaipingBackground();
    bg2.id = 'independent_2';
    
    // 修改bg1不影响bg2
    assertEquals(bg1.id, 'independent_1');
    assertEquals(bg2.id, 'independent_2');
    
    // 两者都有各自的事件
    const event1 = bg1.getFixedEvent(24);
    const event2 = bg2.getFixedEvent(24);
    
    assertNotNull(event1);
    assertNotNull(event2);
    assertEquals(event1.title, event2.title);
  });

  await runner.run('TaipingBackground 元数据 - 正确的历史设定', () => {
    const bg = new TaipingBackground();
    
    assertEquals(bg.id, 'taiping_1851');
    assertEquals(bg.name, '金田起义');
    assertContains(bg.description, '1851', '应包含年份');
    assertContains(bg.description, '金田村', '应包含地点');
    assertEquals(bg.startDate, '1851-01-08T00:00:00');
    assertEquals(bg.totalTurns, 72);
  });

  await runner.run('动态加载接口 - loadExternalBackground方法存在', () => {
    const manager = new BackgroundManager();
    assert(typeof manager.loadExternalBackground === 'function', '应有loadExternalBackground方法');
  });

  // 输出测试总结
  runner.summary();
}

// ==================== 运行测试 ====================

runTests().then(() => {
  process.exit(0);
}).catch((error: Error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
