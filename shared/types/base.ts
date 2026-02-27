/**
 * 基础类型定义
 */

// 身份类型
export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';

// 天气类型
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';

// 特质类型
export type TraitType = 'identity' | 'personality';

// 位置
export interface Position {
  x: number;
  y: number;
}

// 特质
export interface Trait {
  id: string;
  type: TraitType;
  name?: string;
  description?: string;
}
