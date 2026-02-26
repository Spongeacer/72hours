"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("./config"));
const games_1 = __importDefault(require("./games"));
const saves_1 = __importDefault(require("./saves"));
const router = (0, express_1.Router)();
router.use('/config', config_1.default);
router.use('/games', games_1.default);
router.use('/games/:gameId/saves', saves_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map