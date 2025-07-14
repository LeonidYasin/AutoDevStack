import { AIService, AIServiceOptions } from '../services/aiService';
import { PromptTemplates } from '../services/promptTemplates';
import fs from 'fs';

export class DebugEngine {
  static async fixError(logFile: string, targetFile: string) {
    // Читаем код и лог ошибки
    const code = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf-8') : '';
    const error = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf-8') : '';
    const prompt = PromptTemplates.debugEngine({ code, error });
    const fix = await AIService.callAI(prompt, { task: 'text-generation' });
    console.log('[DebugEngine] AI fix suggestion:', fix);
    // TODO: применить fix к файлу
  }
} 