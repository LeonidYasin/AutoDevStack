import { FileService } from '../services/fileService';
import fs from 'fs';

function parsePrismaModels(schema: string): string[] {
  const modelRegex = /model (\w+) \{/g;
  const models: string[] = [];
  let match;
  while ((match = modelRegex.exec(schema))) {
    models.push(match[1]);
  }
  return models;
}

export class ApiGenerator {
  static async generateCrud(schema: string, projectDir: string) {
    const path = require('path');
    const models = parsePrismaModels(schema);
    for (const model of models) {
      const template = fs.readFileSync('templates/express-crud.ts.txt', 'utf-8');
      const code = template.replace(/User/g, model);
      const outPath = path.join(projectDir, 'src', 'adapters', `${model.toLowerCase()}Router.ts`);
      FileService.write(outPath, code);
      console.log(`[ApiGenerator] Сгенерирован ${outPath}`);
    }
  }
} 