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

export class TestGenerator {
  static async generateTests(spec: string, projectDir: string) {
    const path = require('path');
    const schema = fs.existsSync('prisma/schema.prisma') ? fs.readFileSync('prisma/schema.prisma', 'utf-8') : '';
    const models = parsePrismaModels(schema);
    for (const model of models) {
      const template = fs.readFileSync('templates/user-api.test.ts.txt', 'utf-8');
      const code = template.replace(/User/g, model).replace(/user/g, model.toLowerCase());
      const outPath = path.join(projectDir, 'src', 'adapters', `${model.toLowerCase()}-api.test.ts`);
      FileService.write(outPath, code);
      console.log(`[TestGenerator] Сгенерирован ${outPath}`);
    }
  }
} 