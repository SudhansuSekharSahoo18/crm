"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firmController_1 = require("../controllers/firmController");
// import { authenticate } from '../middleware/auth';
// import { checkRole } from '../middleware/roleCheck';
const router = (0, express_1.Router)();
// Route to create a new firm (temporarily disabled auth for testing)
router.post('/', firmController_1.createFirm);
// Route to get all firms (temporarily disabled auth for testing)
router.get('/', firmController_1.getFirms);
// Route to update a firm
router.put('/:id', firmController_1.updateFirm);
// Route to delete a firm
router.delete('/:id', firmController_1.deleteFirm);
exports.default = router;
