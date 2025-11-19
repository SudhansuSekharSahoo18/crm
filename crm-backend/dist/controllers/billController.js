"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBill = exports.updateBill = exports.getBillById = exports.getAllBills = exports.createBill = void 0;
const databaseService_1 = require("../services/databaseService");
// Create a new bill
const createBill = async (req, res) => {
    try {
        const billData = req.body;
        const newBill = await databaseService_1.dbService.createBill(billData);
        res.status(201).json(newBill);
    }
    catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ message: 'Error creating bill', error });
    }
};
exports.createBill = createBill;
// Get all bills
const getAllBills = async (req, res) => {
    try {
        const bills = await databaseService_1.dbService.getBills();
        res.status(200).json(bills);
    }
    catch (error) {
        console.error('Error retrieving bills:', error);
        res.status(500).json({ message: 'Error retrieving bills', error });
    }
};
exports.getAllBills = getAllBills;
// Get a bill by ID
const getBillById = async (req, res) => {
    const { id } = req.params;
    try {
        const bill = await databaseService_1.dbService.getBillById(id);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.status(200).json(bill);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving bill', error });
    }
};
exports.getBillById = getBillById;
// Update a bill
const updateBill = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const updatedBill = await databaseService_1.dbService.updateBill(id, updates);
        res.status(200).json(updatedBill);
    }
    catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ message: 'Error updating bill', error });
    }
};
exports.updateBill = updateBill;
// Delete a bill
const deleteBill = async (req, res) => {
    const { id } = req.params;
    try {
        await databaseService_1.dbService.deleteBill(id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ message: 'Error deleting bill', error });
    }
};
exports.deleteBill = deleteBill;
