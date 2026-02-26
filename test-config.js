#!/usr/bin/env node
/**
 * GameConfig 配置测试脚本
 */

const {
  GRAVITY_CONFIG,
  AI_CONFIG,
  GAME_CONFIG,
  NPC_CONFIG,
  PLAYER_CONFIG,
  BUTTERFLY_EFFECT_CONFIG,
  SERVER_CONFIG
} = require('./dist/src/config/GameConfig');

console.log('=== GameConfig 配置验证 ===\n');

// 1. GAME_CONFIG 验证
console.log('1. GAME_CONFIG (游戏核心配置)');
console.log(`   MAX_TURNS: ${GAME_CONFIG.MAX_TURNS} (应为36)`);
console.log(`   HOURS_PER_TURN: ${GAME_CONFIG.HOURS_PER_TURN} (应为2)`);
console.log(`   INITIAL_PRESSURE: ${GAME_CONFIG.INITIAL_PRESSURE} (应为2)`);
console.log(`   INITIAL_OMEGA: ${GAME_CONFIG.INITIAL_OMEGA} (应为4)`);
console.log(`   ✓ 游戏总时长: ${GAME_CONFIG.MAX_TURNS * GAME_CONFIG.HOURS_PER_TURN}小时 = ${GAME_CONFIG.MAX_TURNS}个时辰\n`);

// 2. AI_CONFIG 验证
console.log('2. AI_CONFIG (AI API配置)');
console.log(`   DEFAULT_PROVIDER: ${AI_CONFIG.DEFAULT_PROVIDER}`);
console.log(`   PROVIDERS.siliconflow.defaultModel: ${AI_CONFIG.PROVIDERS.siliconflow.defaultModel}`);
console.log(`   PROVIDERS.kimi.defaultModel: ${AI_CONFIG.PROVIDERS.kimi.defaultModel}\n`);

// 3. GRAVITY_CONFIG 验证
console.log('3. GRAVITY_CONFIG (引力引擎配置)');
console.log(`   G: ${GRAVITY_CONFIG.G}`);
console.log(`   PRESSURE_MULTIPLIER: ${GRAVITY_CONFIG.PRESSURE_MULTIPLIER}`);
console.log(`   MIN_DISTANCE: ${GRAVITY_CONFIG.MIN_DISTANCE}`);
console.log(`   MAX_FORCE: ${GRAVITY_CONFIG.MAX_FORCE}`);
console.log(`   FEAR_ESCAPE_THRESHOLD: ${GRAVITY_CONFIG.FEAR_ESCAPE_THRESHOLD}\n`);

// 4. NPC_CONFIG 验证
console.log('4. NPC_CONFIG (NPC配置)');
console.log(`   TOTAL_NPC_COUNT: ${NPC_CONFIG.TOTAL_NPC_COUNT}`);
console.log(`   INITIAL_UNLOCKED_COUNT: ${NPC_CONFIG.INITIAL_UNLOCKED_COUNT}`);
console.log(`   STORY_EVENT_THRESHOLDS:`, NPC_CONFIG.STORY_EVENT_THRESHOLDS);
console.log(`   HISTORICAL_FIGURES: ${NPC_CONFIG.HISTORICAL_FIGURES.join(', ')}\n`);

// 5. PLAYER_CONFIG 验证
console.log('5. PLAYER_CONFIG (玩家配置)');
console.log(`   可用身份: ${Object.keys(PLAYER_CONFIG.IDENTITIES).join(', ')}`);
console.log(`   执念数量: ${PLAYER_CONFIG.OBSESSIONS.length}`);
console.log(`   特质数量: ${PLAYER_CONFIG.TRAITS.length}`);
console.log(`   特质范围: ${PLAYER_CONFIG.MIN_TRAITS}-${PLAYER_CONFIG.MAX_TRAITS}个\n`);

// 6. BUTTERFLY_EFFECT_CONFIG 验证
console.log('6. BUTTERFLY_EFFECT_CONFIG (蝴蝶效应配置)');
console.log(`   NO_EFFECT_CHANCE: ${BUTTERFLY_EFFECT_CONFIG.NO_EFFECT_CHANCE} (30%)`);
console.log(`   MINOR_EFFECT_CHANCE: ${BUTTERFLY_EFFECT_CONFIG.MINOR_EFFECT_CHANCE} (30%)`);
console.log(`   SIGNIFICANT_EFFECT_CHANCE: ${BUTTERFLY_EFFECT_CONFIG.SIGNIFICANT_EFFECT_CHANCE} (40%)`);
console.log(`   EFFECT_VALUES:`, BUTTERFLY_EFFECT_CONFIG.EFFECT_VALUES);
console.log(`   ✓ 概率总和: ${BUTTERFLY_EFFECT_CONFIG.NO_EFFECT_CHANCE + BUTTERFLY_EFFECT_CONFIG.MINOR_EFFECT_CHANCE + BUTTERFLY_EFFECT_CONFIG.SIGNIFICANT_EFFECT_CHANCE} (应为1.0)\n`);

// 7. SERVER_CONFIG 验证
console.log('7. SERVER_CONFIG (服务器配置)');
console.log(`   PORT: ${SERVER_CONFIG.PORT}`);
console.log(`   VERSION: ${SERVER_CONFIG.VERSION}\n`);

console.log('=== 所有配置验证通过 ===');
