"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billController_1 = require("../controllers/billController");
const router = (0, express_1.Router)();
// Route to create a new bill
router.post('/', billController_1.createBill);
// Route to get all bills
router.get('/', billController_1.getAllBills);
// Route to get a bill by ID
router.get('/:id', billController_1.getBillById);
// Route to update a bill
router.put('/:id', billController_1.updateBill);
// Route to delete a bill
router.delete('/:id', billController_1.deleteBill);
exports.default = router;
