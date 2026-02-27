"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)({ mergeParams: true });
const saves = new Map();
router.get('/', (req, res) => {
    const { gameId } = req.params;
    const gameSaves = Array.from(saves.values())
        .filter((s) => s.gameId === gameId)
        .sort((a, b) => b.timestamp - a.timestamp);
    res.json({
        success: true,
        data: gameSaves,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
const createSaveSchema = zod_1.z.object({
    name: zod_1.z.string().optional()
});
router.post('/', (0, validateRequest_1.validateRequest)({ body: createSaveSchema }), (req, res) => {
    const { gameId } = req.params;
    const { name } = req.body;
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const saveData = {
        id: saveId,
        gameId,
        name: name || `存档 ${new Date().toLocaleString('zh-CN')}`,
        timestamp: Date.now(),
        turn: 1,
        datetime: new Date().toISOString(),
        pressure: 10,
        omega: 1.0
    };
    saves.set(saveId, saveData);
    res.status(201).json({
        success: true,
        data: saveData,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
router.post('/:saveId/load', (req, res) => {
    const { saveId } = req.params;
    const save = saves.get(saveId);
    if (!save) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'SAVE_NOT_FOUND', message: '存档不存在' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    res.json({
        success: true,
        data: { turn: save.turn, datetime: save.datetime, pressure: save.pressure, omega: save.omega },
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
router.delete('/:saveId', (req, res) => {
    const { saveId } = req.params;
    if (!saves.has(saveId)) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'SAVE_NOT_FOUND', message: '存档不存在' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    saves.delete(saveId);
    res.json({
        success: true,
        data: null,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
// 导出存档
router.get('/:saveId/export', (req, res) => {
    const { saveId } = req.params;
    const save = saves.get(saveId);
    if (!save) {
        return res.status(404).json({
            success: false,
            data: null,
            error: { code: 'SAVE_NOT_FOUND', message: '存档不存在' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    // 返回存档数据的Base64编码
    const exportData = Buffer.from(JSON.stringify(save)).toString('base64');
    res.json({
        success: true,
        data: exportData,
        error: null,
        meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
    });
});
// 导入存档
const importSaveSchema = zod_1.z.object({
    saveData: zod_1.z.string()
});
router.post('/import', (0, validateRequest_1.validateRequest)({ body: importSaveSchema }), (req, res) => {
    const { gameId } = req.params;
    const { saveData } = req.body;
    try {
        // 解码Base64
        const decoded = Buffer.from(saveData, 'base64').toString('utf-8');
        const save = JSON.parse(decoded);
        // 生成新的存档ID
        const newSaveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSave = {
            ...save,
            id: newSaveId,
            gameId,
            timestamp: Date.now()
        };
        saves.set(newSaveId, newSave);
        res.status(201).json({
            success: true,
            data: newSave,
            error: null,
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            data: null,
            error: { code: 'INVALID_SAVE_DATA', message: '存档数据格式错误' },
            meta: { timestamp: new Date().toISOString(), requestId: Math.random().toString(36).substring(2, 15) }
        });
    }
});
exports.default = router;
//# sourceMappingURL=saves.js.map