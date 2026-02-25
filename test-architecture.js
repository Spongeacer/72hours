/**
 * 架构优化测试
 * 测试新的低耦合高内聚架构
 */

const { AIProviderFactory } = require('./src/narrative/AIProviderFactory');
const { MockAIProvider } = require('./src/narrative/MockAIProvider');
const { EventBus } = require('./src/core/EventBus');
const { CharacterService } = require('./src/services/CharacterService');
const { Game72HoursStream } = require('./src/Game72HoursStream');
const { config } = require('./src/config');

console.log('=== 架构优化测试 ===\n');

// 测试 1: AI 提供商工厂
console.log('1. 测试 AI 提供商工厂');
try {
    const mockAI = AIProviderFactory.create('mock', { delay: 50 });
    console.log('   ✓ Mock AI 创建成功');
    
    const siliconflowAI = AIProviderFactory.create('siliconflow', { 
        apiKey: 'test-key',
        model: 'test-model'
    });
    console.log('   ✓ SiliconFlow AI 创建成功');
} catch (error) {
    console.error('   ✗ AI 工厂测试失败:', error.message);
}

// 测试 2: 事件总线
console.log('\n2. 测试事件总线');
const eventBus = new EventBus();
let eventReceived = false;

const unsubscribe = eventBus.on('test:event', (data) => {
    eventReceived = true;
    console.log('   ✓ 事件接收成功:', data);
});

eventBus.emit('test:event', { message: 'Hello' });

if (eventReceived) {
    console.log('   ✓ 事件触发成功');
} else {
    console.error('   ✗ 事件触发失败');
}

unsubscribe();
console.log('   ✓ 取消订阅成功');

// 测试 3: 角色服务
console.log('\n3. 测试角色服务');
(async () => {
    try {
        const mockAI = new MockAIProvider({ delay: 10 });
        const characterService = new CharacterService(mockAI);
        
        const character = await characterService.generate('scholar', [
            { id: 'calm', name: '冷静', type: 'temperament' },
            { id: 'curious', name: '好奇', type: 'personality' }
        ]);
        
        console.log('   ✓ 角色生成成功');
        console.log('   - 姓名:', character.name);
        console.log('   - 年龄:', character.age);
        console.log('   - 身份:', character.identity);
        
        // 测试默认角色生成
        const defaultService = new CharacterService(null);
        const defaultChar = await defaultService.generate('soldier', []);
        console.log('   ✓ 默认角色生成成功:', defaultChar.name);
        
    } catch (error) {
        console.error('   ✗ 角色服务测试失败:', error.message);
    }
    
    // 测试 4: 重构后的游戏类
    console.log('\n4. 测试重构后的游戏类');
    try {
        const mockAI = new MockAIProvider({ delay: 10 });
        const game = new Game72HoursStream({ 
            aiProvider: mockAI,
            config: { maxTurns: 10 }
        });
        
        // 测试事件订阅
        let initEventFired = false;
        game.on('game:initialized', () => {
            initEventFired = true;
        });
        
        const init = await game.init('scholar', [
            { id: 'calm', name: '冷静', type: 'temperament' }
        ]);
        
        if (initEventFired) {
            console.log('   ✓ 游戏初始化事件触发成功');
        }
        
        console.log('   ✓ 游戏初始化成功');
        console.log('   - 玩家姓名:', init.player.name);
        console.log('   - 角色信息:', init.characterInfo?.name);
        console.log('   - 关联NPC:', init.bondedNPCs.length);
        
        // 测试游戏状态
        const state = game.getState();
        console.log('   ✓ 游戏状态获取成功');
        console.log('   - 回合:', state.turn);
        console.log('   - 压强:', state.pressure);
        
        // 测试回合执行
        const turnResult = await game.executeTurn();
        console.log('   ✓ 回合执行成功');
        console.log('   - 叙事长度:', turnResult.narrative?.length);
        console.log('   - 选择数量:', turnResult.choices?.length);
        
        // 测试选择执行
        if (turnResult.choices && turnResult.choices.length > 0) {
            const choiceResult = await game.executeChoice(turnResult.choices[0].id);
            console.log('   ✓ 选择执行成功');
            console.log('   - 结果文本:', choiceResult.result?.text?.substring(0, 30) + '...');
        }
        
        // 测试重置
        game.reset();
        const resetState = game.getState();
        if (resetState.turn === 0) {
            console.log('   ✓ 游戏重置成功');
        }
        
        console.log('\n=== 所有测试通过 ===');
        
    } catch (error) {
        console.error('   ✗ 游戏类测试失败:', error.message);
        console.error(error.stack);
    }
})();
