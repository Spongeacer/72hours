/**
 * TaipingBackground - 太平天国金田起义背景
 * 1851年1月8日 - 1月10日，36个时辰
 */

import { IStoryBackground, FixedEvent, EventEffect } from '../interfaces/IStoryBackground';
import { NPC, Player } from '../../../shared/types';

export class TaipingBackground implements IStoryBackground {
  id = 'taiping_1851';
  name = '金田起义';
  description = '1851年1月，广西金田村，太平天国起义前夕的36个时辰';
  
  startDate = '1851-01-08T00:00:00';
  totalTurns = 36;
  
  // 历史事件时间线
  private fixedEvents: Map<number, FixedEvent> = new Map([
    [24, {
      turn: 24,
      title: '官府缉匪告示',
      description: '村口张贴了缉拿会匪的告示，气氛骤然紧张',
      effects: [
        { type: 'pressure', value: 10 },
        { type: 'global_signal', value: 'official_crackdown' }
      ]
    }],
    [48, {
      turn: 48,
      title: '传教士入村',
      description: '陌生的传教士在村中走动，打听消息',
      effects: [
        { type: 'pressure', value: 15 },
        { type: 'npc_unlock', target: 'missionary', value: true }
      ]
    }],
    [60, {
      turn: 60,
      title: '太平军逼近',
      description: '远处的山火和喊杀声预示着大军即将到来',
      effects: [
        { type: 'pressure', value: 20 },
        { type: 'omega', value: 1.5 }
      ]
    }],
    [36, {
      turn: 36,
      title: '金田起义爆发',
      description: '子时三刻，拜上帝会的火把照亮了夜空',
      effects: [
        { type: 'pressure', value: 50 },
        { type: 'global_signal', value: 'uprising_begins' }
      ]
    }]
  ]);
  
  getEnvironmentalDescription(time: number, weather: string): string {
    const hour = Math.floor(time / 60) % 24;
    
    // 根据时间和天气生成环境描述
    const descriptions: Record<string, Record<string, string>> = {
      night: {
        clear: '月光如水，照在村落的瓦片上，远处偶尔传来狗吠',
        rain: '雨声淅淅沥沥，掩盖了夜行的脚步声',
        fog: '浓雾笼罩，三丈外看不清人影，只有零星的灯火',
        default: '夜色深沉，星光微弱，空气中弥漫着不安'
      },
      dawn: {
        clear: '天边泛起鱼肚白，鸡鸣声此起彼伏',
        default: '黎明前的黑暗最浓，村子里一片死寂'
      },
      day: {
        clear: '阳光刺眼，一切无所遁形，村民神色匆匆',
        rain: '雨水冲刷着泥土路，行人稀少',
        fog: '雾气未散，能见度低，适合隐藏',
        default: '白昼之下，紧张的气氛更加明显'
      },
      dusk: {
        default: '夕阳西下， shadows拉长，危险的时刻即将到来'
      }
    };
    
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 7) timeOfDay = 'dawn';
    else if (hour >= 7 && hour < 17) timeOfDay = 'day';
    else if (hour >= 17 && hour < 20) timeOfDay = 'dusk';
    
    const timeDesc = descriptions[timeOfDay];
    return timeDesc[weather] || timeDesc.default || descriptions.night.default;
  }
  
  getFixedEvent(turn: number): FixedEvent | null {
    return this.fixedEvents.get(turn) || null;
  }
  
  generatePlayerBackstory(identity: string, traits: string[]): string {
    const backstories: Record<string, string> = {
      scholar: `曾是邻县廪生，屡试不第后流落金田，在村中教书糊口。
        ${traits.includes('calm') ? '性情沉稳，' : ''}
        ${traits.includes('curious') ? '对时局变化敏感，' : ''}
        ${traits.includes('honest') ? '不善钻营，' : ''}
        在这个乱世中只求一方安宁。`,
      
      landlord: `金田村的地主，祖上留下的田产不算丰厚，
        但足以维持体面。最近会匪活动频繁，
        ${traits.includes('greedy') ? '担心财产受损，' : ''}
        ${traits.includes('ambitious') ? '暗中观望局势，' : ''}
        夜夜难眠。`,
      
      soldier: `官府派来的士兵，名义上是维持治安，
        实际上对这片土地并不熟悉。
        ${traits.includes('brave') ? '不怕死，' : ''}
        ${traits.includes('brutal') ? '对会匪恨之入骨，' : ''}
        只等上峰一声令下。`,
      
      cultist: `拜上帝会的信众，相信洪秀全是上帝的二子，
        相信天下大同的理想即将实现。
        ${traits.includes('zealous') ? '狂热地传播教义，' : ''}
        ${traits.includes('fearful') ? '但内心深处也有恐惧，' : ''}
        等待着那个决定性的时刻。`
    };
    
    return backstories[identity] || backstories.scholar;
  }
  
  generateNPCBackstory(role: string): string {
    const backstories: Record<string, string> = {
      mother: `你的母亲，一个普通的农妇，经历过饥荒和战乱，
        最大的愿望就是儿子能平安。她不懂什么天下大势，
        只知道最近村子里不太平。`,

      teacher: `村中的教书先生，比你年长十岁，
        曾在省城读过书，见过世面。
        他对时局有自己的判断，但从不明说。
        你们因为都是读书人而走近。`,

      hong_xiuquan: `洪秀全，拜上帝会的创始人，
        自称上帝的二子，耶稣的弟弟。
        他的眼中有一种狂热的光芒，
        让人既敬畏又恐惧。`,

      yang_xiuqing: `杨秀清，拜上帝会的实际组织者，
        出身贫寒，但极具政治手腕。
        他善于笼络人心，也善于排除异己。`,

      missionary: `西洋传教士，在广西一带活动多年，
        表面上传播福音，实际上也在收集情报。
        他对拜上帝会既好奇又警惕。`
    };

    return backstories[role] || `一个普通的村民，在这个乱世中艰难求生。`;
  }
  
  getAtmosphericWords(mood: string): string[] {
    const words: Record<string, string[]> = {
      tense: ['压抑', '紧张', '不安', '躁动', '凝重'],
      fearful: ['恐惧', '战栗', '惊慌', '胆怯', '畏缩'],
      hopeful: ['期待', '渴望', '希冀', '憧憬', '向往'],
      desperate: ['绝望', '疯狂', '孤注一掷', '背水一战', '鱼死网破'],
      calm: ['平静', '沉默', '等待', '观望', '忍耐']
    };
    
    return words[mood] || words.tense;
  }
  
  getImageryPool(): string[] {
    return [
      '火把', '刀光', '血', '雨', '雾', '月光', '瓦片', '泥土路',
      '祠堂', '油灯', '书卷', '十字架', '铜钱', '米袋', '刀鞘',
      '草鞋', '长衫', '辫子', '斗笠', '锄头', '香炉', '符咒'
    ];
  }
  
  contextualizeBehavior(behavior: string, actor: NPC, target: Player): string {
    // 根据背景语境化行为
    const contexts: Record<string, string> = {
      seizure: `${actor.name}的手伸向你的腰间，那里藏着最后一点干粮。
        在这个饥荒的年月，${actor.name}的眼神告诉你：
        "要么给我，要么我们一起死。"`,
      
      conflict: `${actor.name}拔出了刀，刀身在月光下闪着寒光。
        "官府缉拿会匪，"${actor.name}说，"你有两个选择：
        要么跟我走，要么死在这里。"`,
      
      eavesdrop: `${actor.name}躲在祠堂的门后，呼吸声比雨声还轻。
        你们谈论的每一个字，都可能决定明天的生死。`,
      
      conversation: `两个读书人，在乱世的油灯下谈起诗。
        ${actor.name}忽然说："你觉得，这天下还能太平吗？"
        你没有回答，因为你知道答案。`,
      
      request: `${actor.name}跪下，不是因为软弱，是因为别无选择。
        "带我走，"${actor.name}说，"我知道你有门路。"
        你看着${actor.name}，想起自己也曾经这样跪过。`,
      
      give: `${actor.name}把最后一块干粮塞给你，像母亲一样。
        "走吧，"${actor.name}说，"别回头。"
        你接过干粮，发现里面还藏着一枚铜钱。`
    };
    
    return contexts[behavior] || `${actor.name}看着你，眼神复杂。`;
  }
}

export default TaipingBackground;
