import { Request, Response } from 'express';
import { dbService } from '../services/databaseService';

// Create a new bill
export const createBill = async (req: Request, res: Response) => {
  try {
    const billData = req.body;

    const newBill = await dbService.createBill(billData);

    res.status(201).json(newBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error });
  }
};

// Get all bills
export const getAllBills = async (req: Request, res: Response) => {
  try {
    const bills = await dbService.getBills();
    res.status(200).json(bills);
  } catch (error) {
    console.error('Error retrieving bills:', error);
    res.status(500).json({ message: 'Error retrieving bills', error });
  }
};

// Get a bill by ID
export const getBillById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const bill = await dbService.getBillById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bill', error });
  }
};

// Update a bill
export const updateBill = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedBill = await dbService.updateBill(id, updates);

    res.status(200).json(updatedBill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ message: 'Error updating bill', error });
  }
};

// Delete a bill
export const deleteBill = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await dbService.deleteBill(id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Error deleting bill', error });
  }
};