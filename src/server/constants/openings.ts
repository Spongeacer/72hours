/**
 * 游戏开场白
 * 从剧本配置动态生成
 */

import { getCurrentScript } from '../../config/ScriptConfig';

const script = getCurrentScript();
const openingContext = script.opening;

export const OPENINGS: Record<string, string> = {
  scholar: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> ${openingContext}
> 你是一个读书人，不知道历史已经开始了。`,
  
  farmer: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> ${openingContext}
> 你是一个农民，不知道历史已经开始了。`,
  
  merchant: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。
> 窗外有火光，不是灯笼，是火把。
> 你想起最近的传闻——据说有人在暗中集结。
> ${openingContext}`,
  
  soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。
> 上峰说这里有会匪，格杀勿论。
> 你舔了舔嘴唇，有点干。
> ${openingContext}`,
  
  doctor: `> 药香混合着血腥气，从窗外飘进来。
> 你放下手中的草药，望向远处的火光。
> 又有人受伤了，而你知道这意味着什么。
> ${openingContext}`,
  
  bandit: `> 你摸了摸腰间的刀，确认它还在。
> 山下的村子有火光，不是普通的灯火。
> 你知道那些人的来历，也知道自己该做何选择。
> ${openingContext}`
};
