/**
 * 72Hours 入口文件
 */

const { Game72Hours } = require('./Game72Hours');
const { Player } = require('./agents/Player');
const { NPC } = require('./agents/NPC');
const { Agent } = require('./agents/Agent');
const { GravityEngine } = require('./core/GravityEngine');
const { PressureSystem } = require('./core/PressureSystem');
const { MassSystem } = require('./core/MassSystem');
const { CoordinateSystem } = require('./core/CoordinateSystem');
const { TurnManager } = require('./core/TurnManager');
const { NarrativeEngine } = require('./narrative/NarrativeEngine');
const { GAME_CONFIG } = require('./utils/Constants');
const { Utils } = require('./utils/Utils');

module.exports = {
  Game72Hours,
  Player,
  NPC,
  Agent,
  GravityEngine,
  PressureSystem,
  MassSystem,
  CoordinateSystem,
  TurnManager,
  NarrativeEngine,
  GAME_CONFIG,
  Utils
};
