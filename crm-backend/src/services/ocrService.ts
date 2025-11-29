import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';

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

export class OCRService {
  async extractGSTFromImage(imagePath: string): Promise<string | null> {
    try {
      console.log(`🔍 Starting AI-based GST extraction for: ${imagePath}`);
      const startTime = Date.now();
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
      }

      console.log('📄 Running Gemini Vision API...');

      // Get Gemini client (lazy initialization)
      const gemini = getGeminiClient();
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Create the prompt for GST extraction
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
      console.log('Raw AI response:', extractedText);

      // Extract GST number from the response
      const gstNumber = this.extractGSTFromText(extractedText);

      if (gstNumber) {
        console.log('✅ GST number found:', gstNumber);
      } else {
        console.log('⚠️ No GST number found in AI response');
      }

      return gstNumber;
    } catch (error) {
      console.error('❌ AI extraction failed:', error);
      return null;
    }
  }

  private extractGSTFromText(text: string): string | null {
    // Clean the text
    const cleaned = text.replace(/\s+/g, '').toUpperCase();
    
    // GST number pattern: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit/letter, 1 digit
    const gstPattern = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]\d)\b/g;
    
    // Try to find GST pattern
    const matches = cleaned.match(gstPattern);
    
    if (matches && matches.length > 0) {
      // Return the first valid match
      for (const gst of matches) {
        const stateCode = parseInt(gst.substring(0, 2));
        if (stateCode >= 0 && stateCode <= 37) {
          return gst;
        }
      }
    }
    
    // Try with spaces removed from original text
    const gstPatternWithSpaces = /(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]\d)/g;
    const matchWithSpaces = text.replace(/\s+/g, '').toUpperCase().match(gstPatternWithSpaces);
    
    if (matchWithSpaces && matchWithSpaces.length > 0) {
      const gst = matchWithSpaces[0];
      const stateCode = parseInt(gst.substring(0, 2));
      if (stateCode >= 0 && stateCode <= 37) {
        return gst;
      }
    }
    
    return null;
  }

  // Check if file is an image based on extension
  isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }
}

export const ocrService = new OCRService();
