/**
 * GravityEngine 物理引擎测试
 * 
 * 测试范围:
 * 1. 引力计算 F = G*m1*m2/r^2
 * 2. 压强调制 (1 + Ω*P)
 * 3. NPC 移动（恐惧逃跑、K值吸引）
 * 4. 质量计算 M = B+S+K+O
 * 
 * 参考: 基于 Newton 万有引力定律的游戏物理模型
 * @author Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  GravityEngine, 
  MassObject, 
  ForceVector,
  DEFAULT_GRAVITY_CONFIG 
} from '../src/core/GravityEngine';
import { Agent, AgentStates } from '../src/game/Agent';
import { Position } from '../shared/types';

// ============================================
// 测试辅助类和工具
// ============================================

/**
 * 测试用的 Agent 子类
 */
class TestAgent extends Agent {
  getAura(): string {
    return 'test';
  }
}

/**
 * 创建测试用的 MassObject
 */
function createMassObject(
  id: string, 
  mass: number, 
  position: Position, 
  effectiveMass?: number,
  trapConstant?: number
): MassObject {
  return {
    id,
    mass,
    effectiveMass: effectiveMass ?? mass,
    position,
    trapConstant
  };
}

// ============================================
// 测试套件: 引力计算
// ============================================

describe('GravityEngine - 引力计算 (F = G*m1*m2/r^2)', () => {
  let engine: GravityEngine;

  beforeEach(() => {
    engine = new GravityEngine(10, 1.0);
  });

  describe('基础引力计算', () => {
    it('应该正确计算两个物体之间的引力', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

      const force = engine.calculateForce(obj1, obj2);

      // F = G * m1 * m2 / r^2 = 0.8 * 10 * 10 / 100 = 0.8
      const expectedForce = 0.8 * 10 * 10 / (10 * 10);
      expect(force.magnitude).toBeCloseTo(expectedForce, 5);
    });

    it('引力应该随距离平方衰减', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      
      // 距离为 5
      const obj2_near = createMassObject('obj2', 10, { x: 5, y: 0 });
      const force_near = engine.calculateForce(obj1, obj2_near);
      
      // 距离为 10
      const obj2_far = createMassObject('obj2', 10, { x: 10, y: 0 });
      const force_far = engine.calculateForce(obj1, obj2_far);

      // 距离翻倍，引力应该变为 1/4
      expect(force_far.magnitude).toBeCloseTo(force_near.magnitude / 4, 5);
    });

    it('引力应该与质量乘积成正比', () => {
      const obj1 = createMassObject('obj1', 5, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 5, { x: 10, y: 0 });
      const force1 = engine.calculateForce(obj1, obj2);

      const obj3 = createMassObject('obj3', 10, { x: 0, y: 0 });
      const obj4 = createMassObject('obj4', 10, { x: 10, y: 0 });
      const force2 = engine.calculateForce(obj3, obj4);

      // 质量翻倍，引力应该变为 4 倍
      expect(force2.magnitude).toBeCloseTo(force1.magnitude * 4, 5);
    });

    it('应该正确处理对角线方向的引力', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 3, y: 4 }); // 3-4-5 三角形

      const force = engine.calculateForce(obj1, obj2);

      // 距离 = 5
      const distance = 5;
      const expectedMagnitude = 0.8 * 10 * 10 / (distance * distance);
      
      expect(force.distance).toBeCloseTo(distance, 5);
      expect(force.magnitude).toBeCloseTo(expectedMagnitude, 5);
      
      // fx 应该占总力的 3/5
      expect(force.fx).toBeCloseTo(expectedMagnitude * 0.6, 5);
      // fy 应该占总力的 4/5
      expect(force.fy).toBeCloseTo(expectedMagnitude * 0.8, 5);
    });
  });

  describe('边界条件处理', () => {
    it('应该使用最小距离防止除以零', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 0, y: 0 }); // 相同位置

      const force = engine.calculateForce(obj1, obj2);

      // 应该使用 MIN_DISTANCE 而不是实际距离 0
      expect(force.distance).toBe(0);
      expect(force.magnitude).toBeGreaterThan(0);
    });

    it('应该限制最大引力值', () => {
      const obj1 = createMassObject('obj1', 1000, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 1000, { x: 0.01, y: 0 });

      const force = engine.calculateForce(obj1, obj2);

      // 引力不应该超过 MAX_FORCE
      expect(force.magnitude).toBeLessThanOrEqual(DEFAULT_GRAVITY_CONFIG.MAX_FORCE);
    });

    it('应该正确处理极小距离', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 0.001, y: 0 });

      const force = engine.calculateForce(obj1, obj2);

      // 应该使用 MIN_DISTANCE (0.1) 而不是 0.001
      expect(force.magnitude).toBeLessThanOrEqual(DEFAULT_GRAVITY_CONFIG.MAX_FORCE);
      expect(force.magnitude).toBeGreaterThan(0);
    });
  });

  describe('总引力计算', () => {
    it('应该正确计算多个物体对目标的总引力', () => {
      const target = createMassObject('target', 10, { x: 0, y: 0 });
      const obj1 = createMassObject('obj1', 10, { x: 10, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 0, y: 10 });

      const totalForce = engine.calculateTotalForce(target, [obj1, obj2]);

      // 两个垂直方向的力，合力应该是 sqrt(2) 倍
      const singleForce = 0.8 * 10 * 10 / 100;
      const expectedMagnitude = Math.sqrt(singleForce * singleForce + singleForce * singleForce);
      
      expect(totalForce.magnitude).toBeCloseTo(expectedMagnitude, 5);
      expect(totalForce.fx).toBeCloseTo(singleForce, 5);
      expect(totalForce.fy).toBeCloseTo(singleForce, 5);
    });

    it('应该排除自身引力', () => {
      const target = createMassObject('target', 10, { x: 0, y: 0 });
      const others = [target]; // 包含自身

      const totalForce = engine.calculateTotalForce(target, others);

      expect(totalForce.magnitude).toBe(0);
      expect(totalForce.fx).toBe(0);
      expect(totalForce.fy).toBe(0);
    });

    it('应该正确处理空数组', () => {
      const target = createMassObject('target', 10, { x: 0, y: 0 });
      const totalForce = engine.calculateTotalForce(target, []);

      expect(totalForce.magnitude).toBe(0);
      expect(totalForce.fx).toBe(0);
      expect(totalForce.fy).toBe(0);
    });
  });
});

// ============================================
// 测试套件: 压强调制
// ============================================

describe('GravityEngine - 压强调制 (1 + Ω*P)', () => {
  describe('压强对引力的影响', () => {
    it('基础引力应该乘以压强调制因子', () => {
      const pressure = 10;
      const omega = 1.0;
      const engine = new GravityEngine(pressure, omega);
      
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

      const force = engine.calculateForce(obj1, obj2);

      // 基础引力 = 0.8 * 10 * 10 / 100 = 0.8
      const baseForce = 0.8;
      // 压强调制 = 1 + 1.0 * 0.05 = 1.05
      const pressureModifier = 1 + omega * 0.05;
      const expectedForce = baseForce * pressureModifier;
      
      expect(force.magnitude).toBeCloseTo(expectedForce, 5);
    });

    it('高压应该增强引力', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

      // 低压
      const lowPressureEngine = new GravityEngine(10, 1.0);
      const lowForce = lowPressureEngine.calculateForce(obj1, obj2);

      // 高压
      const highPressureEngine = new GravityEngine(100, 1.0);
      const highForce = highPressureEngine.calculateForce(obj1, obj2);

      // 高压引力应该大于低压引力
      expect(highForce.magnitude).toBeGreaterThan(lowForce.magnitude);
      
      // 验证比例
      const ratio = highForce.magnitude / lowForce.magnitude;
      const expectedRatio = (1 + 1.0 * 0.05 * 100 / 10) / (1 + 1.0 * 0.05);
      expect(ratio).toBeCloseTo(expectedRatio, 2);
    });

    it('Ω 值应该影响压强调制强度', () => {
      const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
      const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

      // 低 Ω
      const lowOmegaEngine = new GravityEngine(50, 0.5);
      const lowForce = lowOmegaEngine.calculateForce(obj1, obj2);

      // 高 Ω
      const highOmegaEngine = new GravityEngine(50, 3.0);
      const highForce = highOmegaEngine.calculateForce(obj1, obj2);

      // 高 Ω 应该产生更强的引力
      expect(highForce.magnitude).toBeGreaterThan(lowForce.magnitude);
    });
  });

  describe('压强场计算', () => {
    it('应该正确计算压强场强度', () => {
      const engine = new GravityEngine(10, 1.0);
      const center: Position = { x: 0, y: 0 };
      const maxPressure = 100;

      // 中心点应该最强
      const centerField = engine.calculatePressureField({ x: 0, y: 0 }, center, maxPressure);
      expect(centerField).toBe(maxPressure);

      // 远离中心应该减弱
      const farField = engine.calculatePressureField({ x: 10, y: 0 }, center, maxPressure);
      expect(farField).toBeLessThan(maxPressure);
      expect(farField).toBeGreaterThan(0);
    });

    it('压强场应该随距离衰减', () => {
      const engine = new GravityEngine(10, 1.0);
      const center: Position = { x: 0, y: 0 };
      const maxPressure = 100;

      const field1 = engine.calculatePressureField({ x: 2, y: 0 }, center, maxPressure);
      const field2 = engine.calculatePressureField({ x: 4, y: 0 }, center, maxPressure);

      // 距离翻倍，压强场应该减小
      expect(field2).toBeLessThan(field1);
    });
  });

  describe('物理状态更新', () => {
    it('应该随回合增加压强', () => {
      const engine = new GravityEngine(10, 1.0);
      const initialPressure = engine.pressure;

      engine.updatePhysics(1);

      expect(engine.pressure).toBeGreaterThan(initialPressure);
    });

    it('暴力事件应该加速压强增长', () => {
      const engine1 = new GravityEngine(10, 1.0);
      const engine2 = new GravityEngine(10, 1.0);

      engine1.updatePhysics(1, 0);
      engine2.updatePhysics(1, 2); // 2 个暴力事件

      expect(engine2.pressure).toBeGreaterThan(engine1.pressure);
    });

    it('高压时 Ω 应该指数增长', () => {
      const engine = new GravityEngine(60, 1.0); // 刚好超过阈值
      const initialOmega = engine.omega;

      engine.updatePhysics(1);

      // 压强 >= 60 时，Ω 应该指数增长
      expect(engine.omega).toBeGreaterThan(initialOmega);
    });

    it('低压时 Ω 应该线性增长', () => {
      const engine = new GravityEngine(50, 1.0); // 低于阈值
      const initialOmega = engine.omega;

      engine.updatePhysics(1);

      // 压强 < 60 时，Ω 应该线性增长
      expect(engine.omega).toBeCloseTo(initialOmega + 0.02, 5);
    });

    it('Ω 不应该超过最大值', () => {
      const engine = new GravityEngine(100, 5.0); // 已经是最大值

      engine.updatePhysics(1);

      expect(engine.omega).toBeLessThanOrEqual(5.0);
    });

    it('应该返回正确的物理状态', () => {
      const engine = new GravityEngine(50, 2.0);
      const state = engine.getPhysicsState();

      expect(state.pressure).toBe(50);
      expect(state.omega).toBe(2.0);
    });
  });
});

// ============================================
// 测试套件: NPC 移动
// ============================================

describe('GravityEngine - NPC 移动', () => {
  let engine: GravityEngine;

  beforeEach(() => {
    engine = new GravityEngine(10, 1.0);
  });

  describe('基础移动', () => {
    it('应该根据引力方向移动', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      const newPos = engine.calculateMovement(obj, force);

      // 应该向 x 正方向移动
      expect(newPos.x).toBeGreaterThan(obj.position.x);
      expect(newPos.y).toBe(obj.position.y);
    });

    it('应该根据引力大小调整移动距离', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };

      const weakForce: ForceVector = {
        fx: 1,
        fy: 0,
        magnitude: 1,
        distance: 10
      };

      const strongForce: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      const weakMove = engine.calculateMovement(obj, weakForce);
      const strongMove = engine.calculateMovement(obj, strongForce);

      // 强引力应该产生更大的移动
      expect(Math.abs(strongMove.x - obj.position.x)).toBeGreaterThan(
        Math.abs(weakMove.x - obj.position.x)
      );
    });
  });

  describe('恐惧逃跑机制', () => {
    it('高恐惧时应该远离引力源', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // 低恐惧：向引力源移动
      const lowFearMove = engine.calculateMovement(obj, force, 30);
      
      // 高恐惧：远离引力源
      const highFearMove = engine.calculateMovement(obj, force, 80);

      // 高恐惧应该向相反方向移动
      expect(highFearMove.x).toBeLessThan(obj.position.x);
      expect(lowFearMove.x).toBeGreaterThan(obj.position.x);
    });

    it('恐惧逃跑应该有正确的阈值 (70)', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // 刚好低于阈值
      const belowThreshold = engine.calculateMovement(obj, force, 70);
      // 刚好超过阈值
      const aboveThreshold = engine.calculateMovement(obj, force, 71);

      // 超过阈值应该反转方向
      expect(aboveThreshold.x).toBeLessThan(obj.position.x);
      expect(belowThreshold.x).toBeGreaterThan(obj.position.x);
    });

    it('恐惧逃跑应该有速度加成', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      const normalMove = engine.calculateMovement(obj, force, 30);
      const fearMove = engine.calculateMovement(obj, force, 80);

      // 恐惧逃跑速度应该是正常移动的两倍（反向）
      const normalDistance = Math.abs(normalMove.x - obj.position.x);
      const fearDistance = Math.abs(fearMove.x - obj.position.x);
      
      expect(fearDistance).toBeCloseTo(normalDistance * 2, 5);
    });
  });

  describe('K值吸引机制', () => {
    it('高K值应该增强引力跟随', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // 低K值
      const lowKnotMove = engine.calculateMovement(obj, force, 0, 2);
      // 高K值
      const highKnotMove = engine.calculateMovement(obj, force, 0, 8);

      // 高K值应该移动更远
      expect(Math.abs(highKnotMove.x - obj.position.x)).toBeGreaterThan(
        Math.abs(lowKnotMove.x - obj.position.x)
      );
    });

    it('K值应该有正确的增强因子 (1.5x)', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // K = 0 (无增强)
      const noKnotMove = engine.calculateMovement(obj, force, 0, 0);
      // K > 5 (有增强)
      const highKnotMove = engine.calculateMovement(obj, force, 0, 6);

      const baseDistance = Math.abs(noKnotMove.x - obj.position.x);
      const enhancedDistance = Math.abs(highKnotMove.x - obj.position.x);

      expect(enhancedDistance).toBeCloseTo(baseDistance * 1.5, 5);
    });

    it('负K值应该产生排斥效果', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // 正K值：向引力源移动
      const positiveKnotMove = engine.calculateMovement(obj, force, 0, 5);
      // 负K值：远离引力源
      const negativeKnotMove = engine.calculateMovement(obj, force, 0, -3);

      // 负K值应该向相反方向移动
      expect(negativeKnotMove.x).toBeLessThan(obj.position.x);
      expect(positiveKnotMove.x).toBeGreaterThan(obj.position.x);
    });

    it('K值应该与恐惧效果叠加', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 0,
        magnitude: 10,
        distance: 10
      };

      // 高恐惧 + 高K值（恐惧应该主导）
      const combinedMove = engine.calculateMovement(obj, force, 80, 8);

      // 恐惧逃跑应该主导
      expect(combinedMove.x).toBeLessThan(obj.position.x);
    });
  });

  describe('对角线移动', () => {
    it('应该正确处理对角线方向的移动', () => {
      const obj: MassObject = {
        id: 'npc',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 }
      };
      
      const force: ForceVector = {
        fx: 10,
        fy: 10,
        magnitude: Math.sqrt(200),
        distance: 10
      };

      const newPos = engine.calculateMovement(obj, force);

      // 应该同时向 x 和 y 正方向移动
      expect(newPos.x).toBeGreaterThan(obj.position.x);
      expect(newPos.y).toBeGreaterThan(obj.position.y);
    });
  });
});

// ============================================
// 测试套件: 质量计算
// ============================================

describe('Agent - 质量计算 (M = B+S+K+O)', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent({
      name: 'TestAgent',
      baseMass: 5
    });
  });

  describe('基础质量计算', () => {
    it('应该正确计算基础质量', () => {
      const totalMass = agent.getTotalMass();
      expect(totalMass).toBe(5); // 只有基础质量
    });

    it('基础质量应该等于构造函数传入的值', () => {
      const agent1 = new TestAgent({ name: 'A1', baseMass: 3 });
      const agent2 = new TestAgent({ name: 'A2', baseMass: 10 });

      expect(agent1.getTotalMass()).toBe(3);
      expect(agent2.getTotalMass()).toBe(10);
    });
  });

  describe('故事质量 (S)', () => {
    it('应该正确添加故事质量', () => {
      agent.storyMass = 2;
      
      const totalMass = agent.getTotalMass();
      expect(totalMass).toBe(5 + 2); // B + S
    });

    it('故事质量可以是分数', () => {
      agent.storyMass = 0.5;
      
      const totalMass = agent.getTotalMass();
      expect(totalMass).toBeCloseTo(5.5, 5);
    });
  });

  describe('K值质量', () => {
    it('应该正确计算K值贡献的质量', () => {
      agent.updateKnot('npc1', 4);
      
      const totalMass = agent.getTotalMass();
      // K值质量 = 4 * 0.5 = 2
      expect(totalMass).toBe(5 + 2);
    });

    it('多个K值应该累加', () => {
      agent.updateKnot('npc1', 4);
      agent.updateKnot('npc2', 6);
      
      const totalMass = agent.getTotalMass();
      // K值质量 = (4 + 6) * 0.5 = 5
      expect(totalMass).toBe(5 + 5);
    });

    it('负K值应该减少质量', () => {
      agent.updateKnot('npc1', -4);
      
      const totalMass = agent.getTotalMass();
      // K值质量 = -4 * 0.5 = -2
      expect(totalMass).toBe(5 - 2);
    });

    it('K值应该可以更新', () => {
      agent.updateKnot('npc1', 2);
      expect(agent.getTotalMass()).toBe(5 + 1); // 2 * 0.5

      agent.updateKnot('npc1', 3); // 增加 3
      expect(agent.getTotalMass()).toBe(5 + 2.5); // 5 * 0.5
    });

    it('K值应该可以删除', () => {
      agent.updateKnot('npc1', 4);
      expect(agent.getKnotWith('npc1')).toBe(4);

      agent.updateKnot('npc1', -4); // 归零
      expect(agent.getKnotWith('npc1')).toBe(0);
      
      // 归零后应该从 map 中删除
      const totalMass = agent.getTotalMass();
      expect(totalMass).toBe(5);
    });

    it('K值应该有上下限', () => {
      agent.updateKnot('npc1', 100); // 超过上限
      expect(agent.getKnotWith('npc1')).toBe(10);

      agent.updateKnot('npc2', -100); // 低于下限
      expect(agent.getKnotWith('npc2')).toBe(-10);
    });
  });

  describe('物品质量 (O)', () => {
    it('应该正确添加物品质量', () => {
      agent.objectMass = 3;
      
      const totalMass = agent.getTotalMass();
      expect(totalMass).toBe(5 + 3); // B + O
    });

    it('物品质量应该与其他质量累加', () => {
      agent.storyMass = 2;
      agent.objectMass = 3;
      agent.updateKnot('npc1', 4);
      
      const totalMass = agent.getTotalMass();
      // 5 + 2 + (4 * 0.5) + 3 = 5 + 2 + 2 + 3 = 12
      expect(totalMass).toBe(12);
    });
  });

  describe('完整质量公式', () => {
    it('应该正确计算 M = B + S + K + O', () => {
      // 设置各种质量
      agent.baseMass = 5;      // B
      agent.storyMass = 3;     // S
      agent.objectMass = 2;    // O
      agent.updateKnot('npc1', 4); // K = 4 * 0.5 = 2
      agent.updateKnot('npc2', 6); // K = 6 * 0.5 = 3

      const totalMass = agent.getTotalMass();
      // M = 5 + 3 + (4+6)*0.5 + 2 = 5 + 3 + 5 + 2 = 15
      expect(totalMass).toBe(15);
    });
  });

  describe('有效质量（陷阱）', () => {
    it('应该正确计算有效质量', () => {
      agent.baseMass = 10;
      agent.trapConstant = 0.5;

      const effectiveMass = agent.getEffectiveMass();
      // 有效质量 = 总质量 * (1 + 陷阱常数) = 10 * 1.5 = 15
      expect(effectiveMass).toBe(15);
    });

    it('陷阱常数为0时不应改变有效质量', () => {
      agent.baseMass = 10;
      agent.trapConstant = 0;

      const effectiveMass = agent.getEffectiveMass();
      expect(effectiveMass).toBe(10);
    });

    it('高陷阱常数应该显著增加有效质量', () => {
      agent.baseMass = 10;
      agent.trapConstant = 2.0;

      const effectiveMass = agent.getEffectiveMass();
      // 有效质量 = 10 * (1 + 2) = 30
      expect(effectiveMass).toBe(30);
    });

    it('有效质量应该用于引力计算', () => {
      const engine = new GravityEngine(10, 1.0);
      
      const obj1: MassObject = {
        id: 'obj1',
        mass: 10,
        effectiveMass: 10,
        position: { x: 0, y: 0 },
        trapConstant: 0
      };

      const obj2: MassObject = {
        id: 'obj2',
        mass: 10,
        effectiveMass: 20, // 有陷阱
        position: { x: 10, y: 0 },
        trapConstant: 1.0
      };

      const obj3: MassObject = {
        id: 'obj3',
        mass: 10,
        effectiveMass: 10, // 无陷阱
        position: { x: 10, y: 0 },
        trapConstant: 0
      };

      const forceWithTrap = engine.calculateForce(obj1, obj2);
      const forceWithoutTrap = engine.calculateForce(obj1, obj3);

      // 有陷阱的物体应该产生更强的引力
      expect(forceWithTrap.magnitude).toBeGreaterThan(forceWithoutTrap.magnitude);
      expect(forceWithTrap.magnitude).toBeCloseTo(forceWithoutTrap.magnitude * 2, 5);
    });
  });
});

// ============================================
// 测试套件: 集成测试
// ============================================

describe('GravityEngine - 集成测试', () => {
  it('完整的物理模拟流程', () => {
    // 创建引擎
    const engine = new GravityEngine(10, 1.0);
    
    // 创建两个 Agent
    const agent1 = new TestAgent({ name: 'Agent1', baseMass: 5 });
    const agent2 = new TestAgent({ name: 'Agent2', baseMass: 5 });
    
    // 设置位置
    agent1.position = { x: 0, y: 0 };
    agent2.position = { x: 10, y: 0 };
    
    // 建立关系
    agent1.updateKnot(agent2.id, 6);
    agent2.updateKnot(agent1.id, 6);
    
    // 转换为 MassObject
    const obj1: MassObject = {
      id: agent1.id,
      mass: agent1.getTotalMass(),
      effectiveMass: agent1.getEffectiveMass(),
      position: agent1.position
    };
    
    const obj2: MassObject = {
      id: agent2.id,
      mass: agent2.getTotalMass(),
      effectiveMass: agent2.getEffectiveMass(),
      position: agent2.position
    };
    
    // 计算引力
    const force = engine.calculateForce(obj1, obj2);
    
    // 计算移动
    const newPos = engine.calculateMovement(
      obj1, 
      force, 
      agent1.states.fear,
      agent1.getKnotWith(agent2.id)
    );
    
    // 验证：由于高K值，应该向 agent2 移动
    expect(newPos.x).toBeGreaterThan(obj1.position.x);
    
    // 更新物理状态
    engine.updatePhysics(1, 1);
    expect(engine.pressure).toBeGreaterThan(10);
  });

  it('恐惧逃跑应该覆盖K值吸引', () => {
    const engine = new GravityEngine(10, 1.0);
    
    const agent = new TestAgent({ name: 'Agent', baseMass: 5 });
    agent.position = { x: 0, y: 0 };
    agent.states.fear = 80; // 高恐惧
    
    const obj: MassObject = {
      id: agent.id,
      mass: agent.getTotalMass(),
      effectiveMass: agent.getEffectiveMass(),
      position: agent.position
    };
    
    const force: ForceVector = {
      fx: 10,
      fy: 0,
      magnitude: 10,
      distance: 10
    };
    
    // 高K值但高恐惧
    const newPos = engine.calculateMovement(obj, force, 80, 8);
    
    // 恐惧应该主导，远离引力源
    expect(newPos.x).toBeLessThan(obj.position.x);
  });

  it('压强增长应该增强引力效应', () => {
    const agent1 = new TestAgent({ name: 'Agent1', baseMass: 5 });
    const agent2 = new TestAgent({ name: 'Agent2', baseMass: 5 });
    
    agent1.position = { x: 0, y: 0 };
    agent2.position = { x: 10, y: 0 };
    
    // 低压强引擎
    const lowPressureEngine = new GravityEngine(10, 1.0);
    // 高压强引擎
    const highPressureEngine = new GravityEngine(100, 3.0);
    
    const obj1: MassObject = {
      id: agent1.id,
      mass: agent1.getTotalMass(),
      effectiveMass: agent1.getEffectiveMass(),
      position: agent1.position
    };
    
    const obj2: MassObject = {
      id: agent2.id,
      mass: agent2.getTotalMass(),
      effectiveMass: agent2.getEffectiveMass(),
      position: agent2.position
    };
    
    const lowForce = lowPressureEngine.calculateForce(obj1, obj2);
    const highForce = highPressureEngine.calculateForce(obj1, obj2);
    
    const lowMove = lowPressureEngine.calculateMovement(obj1, lowForce, 0, 5);
    const highMove = highPressureEngine.calculateMovement(obj1, highForce, 0, 5);
    
    // 高压强下移动距离应该更大
    expect(Math.abs(highMove.x - obj1.position.x)).toBeGreaterThan(
      Math.abs(lowMove.x - obj1.position.x)
    );
  });
});

// ============================================
// 测试套件: 边界情况和异常处理
// ============================================

describe('GravityEngine - 边界情况', () => {
  it('应该处理质量为0的情况', () => {
    const engine = new GravityEngine(10, 1.0);
    const obj1 = createMassObject('obj1', 0, { x: 0, y: 0 });
    const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

    const force = engine.calculateForce(obj1, obj2);
    
    // 质量为0应该产生0引力
    expect(force.magnitude).toBe(0);
  });

  it('应该处理极大质量的情况', () => {
    const engine = new GravityEngine(10, 1.0);
    const obj1 = createMassObject('obj1', 10000, { x: 0, y: 0 });
    const obj2 = createMassObject('obj2', 10000, { x: 100, y: 0 });

    const force = engine.calculateForce(obj1, obj2);
    
    // 应该被限制在 MAX_FORCE 以内
    expect(force.magnitude).toBeLessThanOrEqual(DEFAULT_GRAVITY_CONFIG.MAX_FORCE);
  });

  it('应该处理极大距离的情况', () => {
    const engine = new GravityEngine(10, 1.0);
    const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
    const obj2 = createMassObject('obj2', 10, { x: 10000, y: 0 });

    const force = engine.calculateForce(obj1, obj2);
    
    // 极远距离应该产生极小引力（但不一定是0）
    expect(force.magnitude).toBeGreaterThanOrEqual(0);
    expect(force.magnitude).toBeLessThan(1);
  });

  it('应该正确处理自定义配置', () => {
    const customConfig = {
      G: 1.0,
      PRESSURE_MULTIPLIER: 0.1,
      MIN_DISTANCE: 0.5,
      MAX_FORCE: 20.0
    };
    
    const engine = new GravityEngine(10, 1.0, customConfig);
    
    const obj1 = createMassObject('obj1', 10, { x: 0, y: 0 });
    const obj2 = createMassObject('obj2', 10, { x: 10, y: 0 });

    const force = engine.calculateForce(obj1, obj2);
    
    // 使用自定义 G 值计算
    const expectedForce = 1.0 * 10 * 10 / 100 * (1 + 1.0 * 0.1);
    expect(force.magnitude).toBeCloseTo(expectedForce, 5);
  });
});
