import { Request, Response } from 'express';
import { dbService } from '../services/databaseService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

// Lazy initialization of Gemini client to ensure env vars are loaded
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Extract GST number using Gemini Vision API
async function extractGSTWithAI(imagePath: string): Promise<string> {
  try {
    console.log('🔍 Starting AI GST extraction for:', imagePath);
    const startTime = Date.now();

    // Get Gemini client (lazy initialization)
    const gemini = getGeminiClient();
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Read and encode image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `Extract ONLY the vendor/supplier GST number from this bill/invoice image. 
The GST number format is exactly 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 alphanumeric + 1 digit.
Example: 21AAKHV4096D1Z3

Return ONLY the GST number, nothing else. If multiple GST numbers exist, return the vendor/supplier GST (not the buyer's GST).`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const extractedText = response.text().trim();

    const duration = Date.now() - startTime;
    console.log(`⏱️  AI extraction completed in ${duration}ms`);
    
    // Validate GST format
    const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]\d/;
    const match = extractedText.match(gstRegex);
    
    if (match) {
      console.log('✅ Valid GST extracted:', match[0]);
      return match[0];
    } else {
      console.log('⚠️  No valid GST found in response:', extractedText);
      return '';
    }
  } catch (error) {
    console.error('❌ AI GST extraction failed:', error);
    return '';
  }
}

// API endpoint to extract GST from uploaded image
export const extractGSTFromImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📄 Received file for GST extraction:', file.originalname);
    
    // Extract GST using AI
    const gstNumber = await extractGSTWithAI(file.path);
    
    if (gstNumber) {
      res.json({ 
        success: true, 
        gstNumber,
        message: 'GST number extracted successfully' 
      });
    } else {
      res.json({ 
        success: false, 
        gstNumber: '', 
        message: 'Could not extract GST number from image' 
      });
    }
  } catch (error) {
    console.error('Error in extractGSTFromImage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error extracting GST number', 
      error 
    });
  }
};

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