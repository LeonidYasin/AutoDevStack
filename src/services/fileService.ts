import fs from 'fs';
import path from 'path';

export class FileService {
  static read(filePath: string): string {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  }

  static write(filePath: string, content: string) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  static copyTemplate(templateName: string, destPath: string) {
    const src = path.join('templates', templateName);
    fs.copyFileSync(src, destPath);
  }
} 