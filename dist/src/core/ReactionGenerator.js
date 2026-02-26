"use strict";
/**
 * 涌现式选择生成器
 * 基于玩家特质/执念 + NPC行为 + 情境 → 生成玩家可能的反应
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlayerReactions = generatePlayerReactions;
/**
 * 生成玩家反应
 * 基于：玩家特质/执念 + NPC行为 + 情境
 */
function generatePlayerReactions(player, npcBehavior, context) {
    const reactions = [];
    // 1. 基于执念的反应（最深层驱动）
    const obsessionReaction = generateObsessionReaction(player, npcBehavior, context);
    if (obsessionReaction)
        reactions.push(obsessionReaction);
    // 2. 基于主导特质的反应
    const traitReaction = generateTraitReaction(player, npcBehavior, context);
    if (traitReaction)
        reactions.push(traitReaction);
    // 3. 基于本能/情境的反应
    const instinctReaction = generateInstinctReaction(player, npcBehavior, context);
    if (instinctReaction)
        reactions.push(instinctReaction);
    // 如果不足3个，补充通用反应
    while (reactions.length < 3) {
        reactions.push(generateGenericReaction(player, context, reactions.length));
    }
    return reactions.slice(0, 3); // 最多3个
}
/**
 * 基于执念生成反应
 */
function generateObsessionReaction(player, npcBehavior, context) {
    const obsession = player.obsession;
    const npcType = npcBehavior.type;
    // 执念：在乱世中活下去
    if (obsession.includes('活下去') || obsession.includes('活')) {
        if (npcType === '冲突' || npcType === '抢夺') {
            return {
                id: 'obsession_survive_flee',
                text: '你下意识地后退一步，手摸向腰间的刀，但心里只想找个机会逃走',
                type: 'obsession',
                drive: '执念：在乱世中活下去',
                effect: { fear: 1, aggression: -1 }
            };
        }
        if (npcType === '请求') {
            return {
                id: 'obsession_survive_help',
                text: '你犹豫了一下，还是伸出手——谁知道明天自己会不会也需要帮助',
                type: 'obsession',
                drive: '执念：在乱世中活下去（互助）',
                effect: { fear: -1, aggression: -1 }
            };
        }
    }
    // 执念：保护家人平安
    if (obsession.includes('保护') || obsession.includes('家人')) {
        if (context.pressure > 10) {
            return {
                id: 'obsession_protect_family',
                text: '你想起家里的母亲，握紧了拳头——无论如何，得活着回去',
                type: 'obsession',
                drive: '执念：保护家人平安',
                effect: { fear: -2, aggression: 2 }
            };
        }
    }
    // 执念：守住祖传的家业
    if (obsession.includes('家业') || obsession.includes('守住')) {
        if (npcType === '抢夺') {
            return {
                id: 'obsession_defend_property',
                text: '你护住胸口的玉扳指，那是祖传的，比命还重要',
                type: 'obsession',
                drive: '执念：守住祖传的家业',
                effect: { fear: 1, aggression: 2 }
            };
        }
    }
    // 执念：寻找失散的兄弟
    if (obsession.includes('兄弟') || obsession.includes('寻找')) {
        return {
            id: 'obsession_find_brother',
            text: '你盯着他的脸，试图找出熟悉的轮廓——会不会知道弟弟的下落？',
            type: 'obsession',
            drive: '执念：寻找失散的兄弟',
            effect: { fear: -1 }
        };
    }
    // 执念：找到真相
    if (obsession.includes('真相') || obsession.includes('找到')) {
        if (npcType === '偷听' || npcType === '聊天') {
            return {
                id: 'obsession_seek_truth',
                text: '你竖起耳朵，不想漏掉任何细节——这里面一定有秘密',
                type: 'obsession',
                drive: '执念：找到真相',
                effect: { fear: 1 }
            };
        }
    }
    return null;
}
/**
 * 基于主导特质生成反应
 */
function generateTraitReaction(player, npcBehavior, context) {
    const traits = player.traits.map((t) => t.id);
    const npcType = npcBehavior.type;
    // 特质：brave（勇敢）
    if (traits.includes('brave')) {
        if (npcType === '冲突' || context.pressure > 12) {
            return {
                id: 'trait_brave_stand',
                text: '你深吸一口气，站直了身体——怕也没用，不如面对',
                type: 'trait',
                drive: '特质：勇敢',
                effect: { fear: -3, aggression: 1 }
            };
        }
    }
    // 特质：calm（冷静）
    if (traits.includes('calm')) {
        return {
            id: 'trait_calm_assess',
            text: '你强迫自己冷静下来，快速打量四周，寻找最佳的应对方式',
            type: 'trait',
            drive: '特质：冷静',
            effect: { fear: -2 }
        };
    }
    // 特质：curious（好奇）
    if (traits.includes('curious')) {
        if (npcType === '偷听' || npcType === '聊天') {
            return {
                id: 'trait_curious_inquire',
                text: '你忍不住想问个究竟——这背后到底发生了什么？',
                type: 'trait',
                drive: '特质：好奇',
                effect: { fear: 1 }
            };
        }
    }
    // 特质：greedy（贪婪）
    if (traits.includes('greedy')) {
        if (npcType === '抢夺' || npcType === '给予') {
            return {
                id: 'trait_greedy_take',
                text: '你眼睛一亮，心里盘算着能不能从中捞点什么',
                type: 'trait',
                drive: '特质：贪婪',
                effect: { aggression: 2 }
            };
        }
    }
    // 特质：deceitful（狡诈）
    if (traits.includes('deceitful')) {
        return {
            id: 'trait_deceitful_bluff',
            text: '你脸上露出慌张的神色，心里却在盘算怎么骗过他',
            type: 'trait',
            drive: '特质：狡诈',
            effect: { fear: -1, aggression: 1 }
        };
    }
    // 特质：compassionate（慈悲）
    if (traits.includes('compassionate')) {
        if (npcType === '请求' || context.pressure > 10) {
            return {
                id: 'trait_compassionate_help',
                text: '你看着他狼狈的样子，心里一软，无法袖手旁观',
                type: 'trait',
                drive: '特质：慈悲',
                effect: { fear: 1, aggression: -2 }
            };
        }
    }
    return null;
}
/**
 * 基于本能/情境生成反应
 */
function generateInstinctReaction(player, npcBehavior, context) {
    const states = player.states;
    const npcType = npcBehavior.type;
    // 高恐惧时的本能反应
    if (states.fear > 12) {
        return {
            id: 'instinct_fear_flee',
            text: '你的腿在发抖，脑子里只有一个念头：逃',
            type: 'instinct',
            drive: '本能：恐惧',
            effect: { fear: 2 }
        };
    }
    // 高攻击性时的本能反应
    if (states.aggression > 12) {
        if (npcType === '冲突' || npcType === '抢夺') {
            return {
                id: 'instinct_aggression_fight',
                text: '你感到血往头上涌，手已经按在了刀柄上',
                type: 'instinct',
                drive: '本能：攻击性',
                effect: { aggression: 3, fear: -1 }
            };
        }
    }
    // 高饥饿时的本能反应
    if (states.hunger > 12) {
        if (npcType === '给予' || context.pressure > 8) {
            return {
                id: 'instinct_hunger_accept',
                text: '你已经饿得头晕眼花，顾不上什么尊严了',
                type: 'instinct',
                drive: '本能：饥饿',
                effect: { hunger: -3 }
            };
        }
    }
    // 高压情境的本能反应
    if (context.pressure > 15) {
        return {
            id: 'instinct_pressure_panic',
            text: '你感到空气都凝固了，呼吸变得急促——要出大事了',
            type: 'instinct',
            drive: '情境：高压',
            effect: { fear: 2 }
        };
    }
    // 默认本能：保持警惕
    return {
        id: 'instinct_default_caution',
        text: '你保持着警惕，等待事态的发展',
        type: 'instinct',
        drive: '本能：自我保护',
        effect: {}
    };
}
/**
 * 生成通用反应（补充用）
 */
function generateGenericReaction(player, context, index) {
    const generics = [
        {
            id: 'generic_wait',
            text: '你沉默地等待着，看事情会如何发展',
            drive: '通用：观望'
        },
        {
            id: 'generic_prepare',
            text: '你暗中做好准备，以防万一',
            drive: '通用：准备'
        },
        {
            id: 'generic_observe',
            text: '你仔细观察着，试图读懂局势',
            drive: '通用：观察'
        }
    ];
    const gen = generics[index % generics.length];
    return {
        ...gen,
        type: 'context',
        effect: {}
    };
}
exports.default = {
    generatePlayerReactions
};
//# sourceMappingURL=ReactionGenerator.js.map