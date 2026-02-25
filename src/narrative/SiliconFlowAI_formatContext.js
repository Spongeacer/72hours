/**
 * 格式化上下文（优化版）
 */
  formatContext(data) {
    const { scene, spotlight, player, event, memories, turn } = data;
    
    let context = `=== 当前场景 ===\n`;
    context += `回合：${turn || '?'}\n`;
    context += `时间：${scene.time}\n`;
    context += `天气：${scene.weather}\n`;
    
    // 压强氛围描述
    const pressure = scene.pressure;
    let pressureDesc = '';
    if (pressure < 30) pressureDesc = '相对平静，但暗流涌动';
    else if (pressure < 50) pressureDesc = '局势紧张，人们开始警惕';
    else if (pressure < 70) pressureDesc = '危险逼近，冲突一触即发';
    else if (pressure < 90) pressureDesc = '极度危险，生死存亡之际';
    else pressureDesc = '末日降临，命运即将揭晓';
    
    context += `环境压强：${pressure}/100 - ${pressureDesc}\n`;
    context += `历史大势：Ω=${scene.omega}（${scene.omega > 2 ? '历史洪流不可阻挡' : '个人选择仍有意义'}）\n\n`;
    
    if (event) {
      context += `*** 特殊事件触发：${event.id} ***\n`;
      if (event.id === 'raid') context += '官兵正在搜查村庄！\n';
      if (event.id === 'divine') context += '杨秀清天父下凡，会众狂热！\n';
      if (event.id === 'omen') context += '天象异变，人心惶惶！\n';
      if (event.id === 'refugees') context += '大批难民涌入，资源紧张！\n';
      context += '\n';
    }
    
    if (spotlight) {
      context += `=== 聚光灯NPC：${spotlight.name} ===\n`;
      context += `特质：${spotlight.traits?.join(', ') || '未知'}\n`;
      context += `执念：${spotlight.obsession || '未知'}\n`;
      
      const fear = spotlight.states?.fear || 50;
      const aggression = spotlight.states?.aggression || 50;
      context += `状态：恐惧${fear}%(${fear>70?'极度恐慌':fear>50?'不安':'镇定'})，`;
      context += `戾气${aggression}%(${aggression>70?'杀意毕露':aggression>50?'烦躁':'平静'})\n`;
      
      const knot = spotlight.knotWithPlayer || 0;
      let knotDesc = '';
      if (knot >= 8) knotDesc = '生死之交，命运与共';
      else if (knot >= 5) knotDesc = '深厚羁绊，互相信任';
      else if (knot >= 3) knotDesc = '有些交情，但不够深';
      else if (knot > 0) knotDesc = '泛泛之交';
      else knotDesc = '素不相识';
      context += `与你的关系：${knot}/10 - ${knotDesc}\n\n`;
    }
    
    context += `=== 玩家状态 ===\n`;
    context += `身份：${player.identity}\n`;
    context += `特质：${player.traits?.join(', ') || '无'}\n`;
    
    const pFear = player.states?.fear || 50;
    const pAgg = player.states?.aggression || 50;
    const pHunger = player.states?.hunger || 50;
    context += `自身状态：恐惧${pFear}%，戾气${pAgg}%，饥饿${pHunger}%\n`;
    context += `气场：${player.aura}\n`;
    context += `携带：${player.inventory?.join(', ') || '无'}\n\n`;
    
    if (memories && memories.length > 0) {
      context += `=== 相关记忆 ===\n`;
      memories.slice(0, 3).forEach(m => {
        context += `- ${m.content}\n`;
      });
      context += '\n';
    }
    
    context += `=== 写作要求 ===\n`;
    context += `1. 必须体现当前压强${pressure}的氛围（${pressureDesc}）\n`;
    context += `2. 通过动作和细节展现人物状态，不要直白描述心理\n`;
    context += `3. 如果K>5，体现你们之间的默契或羁绊\n`;
    context += `4. 如果P>60，必须有危险或冲突的元素\n`;
    context += `5. 保持1851年清末的时代感\n`;
    
    return context;
  }