/**
 * GravityEngine - 物理引力引擎
 * 实现 F = G * (m1*m2) / r^2 的引力计算
 */

import { Position } from '../../shared/types';
import { GAME_CONFIG } from '../utils/Constants';

export interface GravityConfig {
  G: number;                    // 引力常数
  PRESSURE_MULTIPLIER: number;  // 压强调制系数
  MIN_DISTANCE: number;         // 最小距离（防止除以0）
  MAX_FORCE: number;            // 最大引力限制
}

export const DEFAULT_GRAVITY_CONFIG: GravityConfig = {
  G: 0.8,
  PRESSURE_MULTIPLIER: 0.05,
  MIN_DISTANCE: 0.1,
  MAX_FORCE: 10.0
};

export interface MassObject {
  id: string;
  mass: number;           // 总质量
  effectiveMass: number;  // 有效质量（考虑陷阱）
  position: Position;
  trapConstant?: number;  // 陷阱常数
}

export interface ForceVector {
  fx: number;
  fy: number;
  magnitude: number;
  distance: number;
}

export class GravityEngine {
  config: GravityConfig;
  pressure: number;
  omega: number;

  constructor(
    pressure: number = GAME_CONFIG.PRESSURE.INITIAL,
    omega: number = GAME_CONFIG.OMEGA.INITIAL,
    config: Partial<GravityConfig> = {}
  ) {
    this.pressure = pressure;
    this.omega = omega;
    this.config = { ...DEFAULT_GRAVITY_CONFIG, ...config };
  }

  /**
   * 计算两个物体之间的引力
   * F = G * (m1 * m2) / r^2 * (1 + Ω * pressureMultiplier)
   */
  calculateForce(obj1: MassObject, obj2: MassObject): ForceVector {
    const dx = obj2.position.x - obj1.position.x;
    const dy = obj2.position.y - obj1.position.y;
    
    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy);
    const safeDistance = Math.max(distance, this.config.MIN_DISTANCE);
    
    // 基础引力: F = G * m1 * m2 / r^2
    const baseForce = this.config.G * obj1.effectiveMass * obj2.effectiveMass / (safeDistance * safeDistance);
    
    // 压强调制: 高压下引力增强
    const pressureModifier = 1 + this.omega * this.config.PRESSURE_MULTIPLIER;
    const rawForce = baseForce * pressureModifier;
    
    // 映射到1-20范围
    const normalizedForce = Math.min(20, Math.max(1, Math.round(rawForce * 2)));
    
    // 计算方向向量（使用原始力计算方向）
    const fx = (dx / safeDistance) * rawForce;
    const fy = (dy / safeDistance) * rawForce;
    
    return {
      fx,
      fy,
      magnitude: normalizedForce,  // 1-20
      distance
    };
  }

  /**
   * 计算多个物体对目标物体的总引力
   */
  calculateTotalForce(target: MassObject, others: MassObject[]): ForceVector {
    let totalFx = 0;
    let totalFy = 0;
    let maxMagnitude = 0;
    let minDistance = Infinity;

    for (const other of others) {
      if (other.id === target.id) continue;
      
      const force = this.calculateForce(target, other);
      totalFx += force.fx;
      totalFy += force.fy;
      maxMagnitude = Math.max(maxMagnitude, force.magnitude);
      minDistance = Math.min(minDistance, force.distance);
    }

    return {
      fx: totalFx,
      fy: totalFy,
      magnitude: Math.sqrt(totalFx * totalFx + totalFy * totalFy),
      distance: minDistance
    };
  }

  /**
   * 根据引力计算移动向量
   */
  calculateMovement(
    obj: MassObject,
    force: ForceVector,
    fear: number = 0,
    knot: number = 0
  ): Position {
    // 基础移动：向引力源移动
    let moveX = force.fx * 0.1;  // 缩放因子
    let moveY = force.fy * 0.1;

    // 恐惧修正：高恐惧时远离引力源 (1-20范围，14对应原70)
    if (fear > 14) {
      moveX = -moveX * 2;
      moveY = -moveY * 2;
    }

    // K值修正：高K值时更倾向跟随引力 (1-20范围，10对应原5)
    if (knot > 10) {
      moveX *= 1.5;
      moveY *= 1.5;
    } else if (knot < 0) {
      // 负K值：排斥
      moveX = -moveX;
      moveY = -moveY;
    }

    return {
      x: obj.position.x + moveX,
      y: obj.position.y + moveY
    };
  }

  /**
   * 计算压强场（Pressure Field）
   * 高压区域产生更强的引力效应
   */
  calculatePressureField(position: Position, center: Position, maxPressure: number): number {
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 距离中心越近，压强场效应越强
    const fieldStrength = maxPressure / (1 + distance * 0.5);
    return Math.min(fieldStrength, maxPressure);
  }

  /**
   * 更新压强和Ω
   */
  updatePhysics(turn: number, violenceEvents: number = 0): void {
    // 基础压强增长 (使用配置值)
    this.pressure += GAME_CONFIG.PRESSURE.BASE_GROWTH + violenceEvents * GAME_CONFIG.PRESSURE.VIOLENCE_BONUS;
    this.pressure = Math.min(this.pressure, GAME_CONFIG.PRESSURE.MAX);
    
    // Ω 增长 (使用配置值)
    if (this.omega >= GAME_CONFIG.OMEGA.EXPONENTIAL_THRESHOLD) {
      // 超过阈值后指数增长
      this.omega = Math.min(GAME_CONFIG.OMEGA.MAX, this.omega * GAME_CONFIG.OMEGA.EXPONENTIAL_BASE);
    } else {
      // 线性增长
      this.omega += GAME_CONFIG.OMEGA.LINEAR_GROWTH;
      this.omega = Math.min(this.omega, GAME_CONFIG.OMEGA.MAX);
    }
  }

  /**
   * 获取当前物理状态
   */
  getPhysicsState(): { pressure: number; omega: number } {
    return {
      pressure: this.pressure,
      omega: this.omega
    };
  }
}

export default GravityEngine;
