"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrService = exports.OCRService = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class OCRService {
    async extractGSTFromImage(imagePath) {
        try {
            console.log(`🔍 Starting GST number extraction for: ${imagePath}`);
            // Check if file exists
            if (!fs_1.default.existsSync(imagePath)) {
                throw new Error(`File not found: ${imagePath}`);
            }
            const { data: { text } } = await tesseract_js_1.default.recognize(imagePath, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            // Extract GST number from the text
            const gstNumber = this.extractGSTNumber(text);
            if (gstNumber) {
                console.log(`✅ GST number extracted successfully: ${gstNumber}`);
            }
            else {
                console.log(`⚠️ No GST number found in the document`);
            }
            return gstNumber;
        }
        catch (error) {
            console.error('❌ GST extraction failed:', error);
            throw new Error(`GST extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    extractGSTNumber(text) {
        // Clean the text first
        const cleanedText = text.replace(/\s+/g, ' ').toUpperCase();
        // GST number patterns
        // Standard GST format: 22AAAAA0000A1Z5 (15 characters)
        // Format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit + 1 alphanumeric + 1 digit
        const gstPatterns = [
            // Standard GST pattern
            /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d\b/g,
            // GST with spaces or special characters
            /\b\d{2}\s*[A-Z]{5}\s*\d{4}\s*[A-Z]\s*\d\s*[A-Z]\s*\d\b/g,
            // GST number with common prefixes
            /(?:GST\s*(?:NO|NUMBER|NUM|#)?[:\-\s]*|GSTIN[:\-\s]*|GST\s*IN[:\-\s]*)\s*(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d)/gi,
            // More flexible pattern for OCR errors
            /\b\d{2}[A-Z0-9]{5}\d{4}[A-Z0-9]\d[A-Z0-9]\d\b/g
        ];
        for (const pattern of gstPatterns) {
            const matches = cleanedText.match(pattern);
            if (matches) {
                for (let match of matches) {
                    // Clean the match by removing spaces and extracting just the GST number
                    let gstNumber = match.replace(/[^A-Z0-9]/g, '');
                    // If it's from a labeled pattern, extract the number part
                    if (match.toLowerCase().includes('gst')) {
                        const numberMatch = match.match(/(\d{2}[A-Z0-9]{5}\d{4}[A-Z0-9]\d[A-Z0-9]\d)/i);
                        if (numberMatch) {
                            gstNumber = numberMatch[1].toUpperCase();
                        }
                    }
                    // Validate GST number format
                    if (this.isValidGSTFormat(gstNumber)) {
                        return gstNumber;
                    }
                }
            }
        }
        // Try to find PAN-like patterns that might be part of GST
        const panPattern = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
        const panMatches = cleanedText.match(panPattern);
        if (panMatches) {
            for (const pan of panMatches) {
                // Look for state code (2 digits) before this PAN
                const beforePan = cleanedText.indexOf(pan);
                const prefix = cleanedText.substring(Math.max(0, beforePan - 10), beforePan);
                const stateCodeMatch = prefix.match(/\d{2}$/);
                if (stateCodeMatch) {
                    // Look for suffix after PAN (1 digit + 1 alphanumeric + 1 digit)
                    const afterPan = cleanedText.substring(beforePan + pan.length, beforePan + pan.length + 10);
                    const suffixMatch = afterPan.match(/^(\d[A-Z0-9]\d)/);
                    if (suffixMatch) {
                        const potentialGST = stateCodeMatch[0] + pan + suffixMatch[1];
                        if (this.isValidGSTFormat(potentialGST)) {
                            return potentialGST;
                        }
                    }
                }
            }
        }
        return null;
    }
    isValidGSTFormat(gst) {
        // GST number should be exactly 15 characters
        if (gst.length !== 15)
            return false;
        // First 2 characters should be digits (state code: 01-37)
        const stateCode = parseInt(gst.substring(0, 2));
        if (isNaN(stateCode) || stateCode < 1 || stateCode > 37)
            return false;
        // Characters 3-7 should be letters (PAN first 5 chars)
        if (!/^[A-Z]{5}$/.test(gst.substring(2, 7)))
            return false;
        // Characters 8-11 should be digits (PAN last 4 digits)
        if (!/^\d{4}$/.test(gst.substring(7, 11)))
            return false;
        // Character 12 should be a letter (PAN check digit)
        if (!/^[A-Z]$/.test(gst.substring(11, 12)))
            return false;
        // Character 13 should be a digit
        if (!/^\d$/.test(gst.substring(12, 13)))
            return false;
        // Character 14 should be alphanumeric
        if (!/^[A-Z0-9]$/.test(gst.substring(13, 14)))
            return false;
        // Character 15 should be a digit
        if (!/^\d$/.test(gst.substring(14, 15)))
            return false;
        return true;
    }
    // Keep the old method for backward compatibility if needed
    async extractTextFromImage(imagePath) {
        try {
            console.log(`🔍 Starting OCR extraction for: ${imagePath}`);
            // Check if file exists
            if (!fs_1.default.existsSync(imagePath)) {
                throw new Error(`File not found: ${imagePath}`);
            }
            const { data: { text } } = await tesseract_js_1.default.recognize(imagePath, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            // Clean up the extracted text
            const cleanedText = this.cleanExtractedText(text);
            console.log(`✅ OCR extraction completed. Text length: ${cleanedText.length} characters`);
            console.log(`📄 Extracted text preview: ${cleanedText.substring(0, 200)}...`);
            return cleanedText;
        }
        catch (error) {
            console.error('❌ OCR extraction failed:', error);
            throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    cleanExtractedText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove special characters that are likely OCR errors
            .replace(/[^\w\s\-.,():\/\$₹%@#]/g, '')
            // Trim whitespace
            .trim()
            // Limit length to prevent overly long descriptions
            .substring(0, 2000);
    }
    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
        const extension = path_1.default.extname(filename).toLowerCase();
        return imageExtensions.includes(extension);
    }
}
exports.OCRService = OCRService;
exports.ocrService = new OCRService();
