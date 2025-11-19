"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFirm = exports.updateFirm = exports.getFirms = exports.createFirm = void 0;
const databaseService_1 = require("../services/databaseService");
let fallbackFirms = [];
let nextId = 1;
// Create a new firm
const createFirm = async (req, res) => {
    try {
        const { name, gstNumber } = req.body;
        // Validate input
        if (!name || !gstNumber) {
            return res.status(400).json({ message: 'Name and GST number are required' });
        }
        try {
            // Try to create firm in database
            const newFirm = await databaseService_1.dbService.createFirm(name.trim(), gstNumber.trim());
            console.log('Firm created in database:', newFirm);
            // Return with _id for frontend compatibility
            res.status(201).json({
                _id: newFirm.id.toString(),
                id: newFirm.id,
                name: newFirm.name,
                gstNumber: newFirm.gstNumber,
                createdAt: newFirm.createdAt,
                updatedAt: newFirm.updatedAt
            });
        }
        catch (dbError) {
            // Database failed, use fallback storage
            console.log('Database error, using fallback storage:', dbError.message);
            // Check for duplicate GST number in fallback storage
            const existingFirm = fallbackFirms.find(f => f.gstNumber === gstNumber);
            if (existingFirm) {
                return res.status(400).json({ message: 'GST number already exists' });
            }
            const newFirm = {
                id: `fallback-${nextId++}`,
                name: name.trim(),
                gstNumber: gstNumber.trim(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            fallbackFirms.push(newFirm);
            console.log('Firm created in fallback storage:', newFirm);
            // Return with _id for frontend compatibility
            res.status(201).json({
                _id: newFirm.id,
                ...newFirm
            });
        }
    }
    catch (error) {
        console.error('Error in createFirm:', error);
        res.status(500).json({ message: 'Error creating firm', error: error.message });
    }
};
exports.createFirm = createFirm;
// Get all firms
const getFirms = async (req, res) => {
    try {
        try {
            // Try to get firms from database
            const firms = await databaseService_1.dbService.getFirms();
            console.log('Firms retrieved from database:', firms.length);
            // Return with _id for frontend compatibility
            const formattedFirms = firms.map(firm => ({
                _id: firm.id.toString(),
                id: firm.id,
                name: firm.name,
                gstNumber: firm.gstNumber,
                createdAt: firm.createdAt,
                updatedAt: firm.updatedAt
            }));
            res.status(200).json(formattedFirms);
        }
        catch (dbError) {
            // Database failed, use fallback storage
            console.log('Database error, using fallback storage:', dbError.message);
            // Return fallback firms with _id for frontend compatibility
            const formattedFirms = fallbackFirms.map(firm => ({
                _id: firm.id,
                ...firm
            }));
            res.status(200).json(formattedFirms);
        }
    }
    catch (error) {
        console.error('Error in getFirms:', error);
        res.status(500).json({ message: 'Error retrieving firms', error: error.message });
    }
};
exports.getFirms = getFirms;
// Update a firm
const updateFirm = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, gstNumber } = req.body;
        // Validate input
        if (!name || !gstNumber) {
            return res.status(400).json({ message: 'Name and GST number are required' });
        }
        try {
            // Try to update firm in database
            const updatedFirm = await databaseService_1.dbService.updateFirm(parseInt(id), name.trim(), gstNumber.trim());
            console.log('Firm updated in database:', updatedFirm);
            res.status(200).json({
                _id: updatedFirm.id.toString(),
                id: updatedFirm.id,
                name: updatedFirm.name,
                gstNumber: updatedFirm.gstNumber,
                createdAt: updatedFirm.createdAt,
                updatedAt: updatedFirm.updatedAt
            });
        }
        catch (dbError) {
            // Database failed, use fallback storage
            console.log('Database error, using fallback storage:', dbError.message);
            const firmIndex = fallbackFirms.findIndex(f => f.id === id);
            if (firmIndex === -1) {
                return res.status(404).json({ message: 'Firm not found' });
            }
            // Check for duplicate GST number in fallback storage
            const existingFirm = fallbackFirms.find(f => f.gstNumber === gstNumber && f.id !== id);
            if (existingFirm) {
                return res.status(400).json({ message: 'GST number already exists' });
            }
            fallbackFirms[firmIndex] = {
                ...fallbackFirms[firmIndex],
                name: name.trim(),
                gstNumber: gstNumber.trim(),
                updatedAt: new Date()
            };
            console.log('Firm updated in fallback storage:', fallbackFirms[firmIndex]);
            res.status(200).json({
                _id: fallbackFirms[firmIndex].id,
                ...fallbackFirms[firmIndex]
            });
        }
    }
    catch (error) {
        console.error('Error in updateFirm:', error);
        res.status(500).json({ message: 'Error updating firm', error: error.message });
    }
};
exports.updateFirm = updateFirm;
// Delete a firm
const deleteFirm = async (req, res) => {
    try {
        const { id } = req.params;
        try {
            // Try to delete firm from database
            await databaseService_1.dbService.deleteFirm(parseInt(id));
            console.log('Firm deleted from database:', id);
            res.status(204).send();
        }
        catch (dbError) {
            // Database failed, use fallback storage
            console.log('Database error, using fallback storage:', dbError.message);
            const firmIndex = fallbackFirms.findIndex(f => f.id === id);
            if (firmIndex === -1) {
                return res.status(404).json({ message: 'Firm not found' });
            }
            fallbackFirms.splice(firmIndex, 1);
            console.log('Firm deleted from fallback storage:', id);
            res.status(204).send();
        }
    }
    catch (error) {
        console.error('Error in deleteFirm:', error);
        res.status(500).json({ message: 'Error deleting firm', error: error.message });
    }
};
exports.deleteFirm = deleteFirm;
