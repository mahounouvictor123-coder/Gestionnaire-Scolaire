// @ts-ignore
import mammoth from 'mammoth';

/**
 * Extracts raw text from a Microsoft Word (.docx) file ArrayBuffer or File
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value ? result.value.trim() : '';
  } catch (err) {
    console.warn('Failed to extract text from docx via mammoth:', err);
    return '';
  }
}

/**
 * Extracts raw text from a base64 DataURL representing a .docx file
 */
export async function extractTextFromDocxDataUrl(dataUrl: string): Promise<string> {
  try {
    if (!dataUrl || !dataUrl.includes(',')) return '';
    const base64 = dataUrl.split(',')[1];
    if (!base64) return '';
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value ? result.value.trim() : '';
  } catch (err) {
    console.warn('Failed to extract text from docx dataUrl:', err);
    return '';
  }
}

/**
 * Extracts HTML from a Microsoft Word (.docx) file
 */
export async function extractHtmlFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value ? result.value.trim() : '';
  } catch (err) {
    console.warn('Failed to extract HTML from docx via mammoth:', err);
    return '';
  }
}

