/**
 * 场景位置系统 - 管理场景转换和位置描述
 * 基于 DESIGN.md：物理驱动叙事，故事自己涌现
 */

const { GAME_CONFIG } = require('../utils/Constants');

class SceneLocationSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 预定义场景位置（金田村地图）
    this.locations = {
      // 核心区域
      home: {
        id: 'home',
        name: '家中',
        description: '土坯房，灶台前，破旧的窗纸',
        coordinates: { x: 0, y: 0 },
        npcs: ['mother'],
        tags: ['private', 'safe', 'family']
      },
      school: {
        id: 'school',
        name: '私塾',
        description: '青瓦屋檐下，书案前，墨香与旧书',
        coordinates: { x: 2, y: 1 },
        npcs: ['teacher'],
        tags: ['public', 'scholar', 'quiet']
      },
      ancestral_hall: {
        id: 'ancestral_hall',
        name: '祠堂',
        description: '飞檐斗拱，香火缭绕，祖宗牌位前',
        coordinates: { x: -1, y: 2 },
        npcs: [],
        tags: ['sacred', 'public', 'gathering']
      },
      village_entrance: {
        id: 'village_entrance',
        name: '村口',
        description: '老槐树下，石阶旁，进出村庄的必经之路',
        coordinates: { x: 0, y: -2 },
        npcs: [],
        tags: ['public', 'transit', 'open']
      },
      
      // 外围区域
      broken_temple: {
        id: 'broken_temple',
        name: '破庙',
        description: '断壁残垣，稻草堆里，漏风的屋顶',
        coordinates: { x: -2, y: -1 },
        npcs: [],
        tags: ['ruin', 'hidden', 'shelter']
      },
      well: {
        id: 'well',
        name: '井边',
        description: '青石井沿，辘轳旁，村民聚集处',
        coordinates: { x: 1, y: -1 },
        npcs: [],
        tags: ['public', 'water', 'gathering']
      },
      field: {
        id: 'field',
        name: '田埂',
        description: '稻田间，田埂上，远处的炊烟',
        coordinates: { x: 3, y: 0 },
        npcs: [],
        tags: ['open', 'work', 'quiet']
      },
      mountain_path: {
        id: 'mountain_path',
        name: '山路',
        description: '蜿蜒小径，竹林深处，通往山外',
        coordinates: { x: -3, y: 2 },
        npcs: [],
        tags: ['transit', 'hidden', 'escape']
      }
    };
    
    // 场景转换描述模板
    this.transitionTemplates = {
      short: [
        '你离开{from}，向{to}走去。',
        '从{from}出来，你来到{to}。',
        '{from}的灯火渐远，{to}就在眼前。'
      ],
      medium: [
        '你告别{from}的{from_feature}，沿着{path}走向{to}。{weather_desc}',
        '从{from}出来，{time_passing}，你来到{to}。{to}的{to_feature}映入眼帘。',
        '{from}的{from_sound}渐渐远去，你踏着{ground}走向{to}。'
      ],
      long: [
        '你离开{from}，{from}的{from_feature}在身后渐渐模糊。{time_passing}，你沿着{path}走过{landmark}，终于来到{to}。{to}的{to_feature}在{weather_desc}中显得格外醒目。',
        '告别{from}，你踏上通往{to}的路。{journey_desc}当你到达{to}时，{to_atmosphere}。'
      ]
    };
    
    // 路径描述
    this.pathDescriptions = {
      'home-school': '村中的小路',
      'home-ancestral_hall': '石板巷',
      'home-village_entrance': '土路',
      'school-ancestral_hall': '青石板路',
      'school-well': '井台边的小径',
      'village_entrance-well': '村道',
      'village_entrance-field': '田埂',
      'ancestral_hall-mountain_path': '后山小路',
      'broken_temple-village_entrance': '荒径',
      'default': '蜿蜒的小路'
    };
    
    // 地面描述
    this.groundDescriptions = {
      clear: '干燥的泥土',
      rain: '泥泞的路面',
      fog: '潮湿的露水',
      night: '结霜的地面'
    };
  }
  
  /**
   * 根据坐标获取位置
   */
  getLocationByCoordinates(x, y, tolerance = 1) {
    for (const loc of Object.values(this.locations)) {
      const dist = Math.sqrt(
        Math.pow(loc.coordinates.x - x, 2) + 
        Math.pow(loc.coordinates.y - y, 2)
      );
      if (dist <= tolerance) {
        return loc;
      }
    }
    return null;
  }
  
  /**
   * 获取位置ID
   */
  getLocationId(x, y) {
    const loc = this.getLocationByCoordinates(x, y);
    return loc ? loc.id : 'unknown';
  }
  
  /**
   * 获取位置名称
   */
  getLocationName(x, y) {
    const loc = this.getLocationByCoordinates(x, y);
    return loc ? loc.name : '未知之地';
  }
  
  /**
   * 生成场景转换描述
   * 基于 DESIGN.md：物理驱动，故事涌现
   */
  generateTransition(fromX, fromY, toX, toY, weather, timeOfDay, options = {}) {
    const fromLoc = this.getLocationByCoordinates(fromX, fromY);
    const toLoc = this.getLocationByCoordinates(toX, toY);
    
    if (!fromLoc || !toLoc) {
      return this.generateGenericTransition(weather, timeOfDay);
    }
    
    // 如果位置相同，没有转换
    if (fromLoc.id === toLoc.id) {
      return null;
    }
    
    // 确定转换长度
    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    let templateType = 'short';
    if (distance > 2) templateType = 'medium';
    if (distance > 4 || options.detailed) templateType = 'long';
    
    // 选择模板
    const templates = this.transitionTemplates[templateType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 获取路径描述
    const pathKey = [`${fromLoc.id}-${toLoc.id}`, `${toLoc.id}-${fromLoc.id}`]
      .find(key => this.pathDescriptions[key]);
    const pathDesc = pathKey ? this.pathDescriptions[pathKey] : this.pathDescriptions.default;
    
    // 填充模板
    let transition = template
      .replace(/{from}/g, fromLoc.name)
      .replace(/{to}/g, toLoc.name)
      .replace(/{from_feature}/g, this.extractFeature(fromLoc.description))
      .replace(/{to_feature}/g, this.extractFeature(toLoc.description))
      .replace(/{path}/g, pathDesc)
      .replace(/{weather_desc}/g, this.getWeatherDesc(weather))
      .replace(/{time_passing}/g, this.getTimePassingDesc(distance))
      .replace(/{ground}/g, this.groundDescriptions[weather] || '小路')
      .replace(/{from_sound}/g, this.getLocationSound(fromLoc))
      .replace(/{landmark}/g, this.getLandmark(fromLoc, toLoc))
      .replace(/{journey_desc}/g, this.getJourneyDesc(weather, timeOfDay))
      .replace(/{to_atmosphere}/g, this.getAtmosphereDesc(toLoc, weather, timeOfDay));
    
    return {
      text: transition,
      from: fromLoc,
      to: toLoc,
      distance,
      type: templateType
    };
  }
  
  /**
   * 提取场景特征
   */
  extractFeature(description) {
    // 提取描述中的核心特征（通常是逗号前的部分）
    const parts = description.split('，');
    return parts[0] || description;
  }
  
  /**
   * 获取天气描述
   */
  getWeatherDesc(weather) {
    const descs = {
      clear: '晴朗的天空下',
      rain: '细雨中',
      fog: '浓雾弥漫',
      night: '夜色里'
    };
    return descs[weather] || '';
  }
  
  /**
   * 获取时间流逝描述
   */
  getTimePassingDesc(distance) {
    if (distance <= 2) return '不一会儿';
    if (distance <= 4) return '走了一炷香时间';
    return '走了约莫半个时辰';
  }
  
  /**
   * 获取位置声音
   */
  getLocationSound(location) {
    const sounds = {
      home: '灶膛里的噼啪声',
      school: '书页翻动的沙沙声',
      ancestral_hall: '香火燃烧的细微声响',
      village_entrance: '犬吠声',
      broken_temple: '风吹过破洞的呜咽',
      well: '辘轳转动的吱呀声',
      field: '风吹稻叶的沙沙声',
      mountain_path: '林间的鸟鸣'
    };
    return sounds[location.id] || '远处的声响';
  }
  
  /**
   * 获取地标
   */
  getLandmark(from, to) {
    // 根据起点和终点返回中间地标
    const landmarks = {
      'home-school': '村口的老槐树',
      'home-ancestral_hall': '石板巷的转角',
      'school-ancestral_hall': '祠堂前的石狮子',
      'village_entrance-field': '田埂上的稻草人',
      'default': '路边的野草'
    };
    const key = `${from.id}-${to.id}`;
    return landmarks[key] || landmarks.default;
  }
  
  /**
   * 获取旅程描述
   */
  getJourneyDesc(weather, timeOfDay) {
    const descs = {
      clear: '阳光洒在身上，',
      rain: '雨水打湿了衣襟，',
      fog: '雾气打湿了眉毛，',
      night: '月光照亮前路，'
    };
    return descs[weather] || '';
  }
  
  /**
   * 获取氛围描述
   */
  getAtmosphereDesc(location, weather, timeOfDay) {
    const baseDesc = location.description.split('，')[0];
    
    if (weather === 'night') {
      return `${baseDesc}在月光下显得格外寂静`;
    }
    if (weather === 'fog') {
      return `${baseDesc}在雾中若隐若现`;
    }
    if (weather === 'rain') {
      return `雨水顺着${baseDesc}滴落`;
    }
    return `${baseDesc}在阳光下清晰可见`;
  }
  
  /**
   * 生成通用转换描述
   */
  generateGenericTransition(weather, timeOfDay) {
    const descs = [
      `你沿着${this.groundDescriptions[weather] || '小路'}前行。`,
      `${this.getWeatherDesc(weather)}，你继续赶路。`,
      '四周的景象渐渐变化。'
    ];
    return {
      text: descs[Math.floor(Math.random() * descs.length)],
      from: null,
      to: null,
      distance: 0,
      type: 'generic'
    };
  }
  
  /**
   * 获取当前位置的完整描述
   */
  getLocationDescription(x, y, weather, timeOfDay) {
    const loc = this.getLocationByCoordinates(x, y);
    if (!loc) return '一片荒野';
    
    let desc = loc.description;
    
    // 根据天气和时间调整描述
    if (weather === 'night') {
      desc += '，月光下';
    } else if (weather === 'fog') {
      desc += '，雾气中';
    } else if (weather === 'rain') {
      desc += '，雨声里';
    }
    
    return desc;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SceneLocationSystem };
}
