import { DebugEngine } from './debugEngine';
import { PrismaGenerator } from '../generators/prismaGenerator';
import { PrismaAdapter } from '../adapters/prismaAdapter';
import { ApiGenerator } from '../generators/apiGenerator';
import { FrontendGenerator } from '../generators/frontendGenerator';
import { TestGenerator } from '../generators/testGenerator';
import fs from 'fs';
import net from 'net';

async function findFreePort(start: number = 3001, end: number = 3999): Promise<number> {
  function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '0.0.0.0');
    });
  }
  for (let port = start; port <= end; port++) {
    if (await checkPort(port)) return port;
  }
  throw new Error('Нет свободных портов');
}

export class Orchestrator {
  static async runFix(logFile: string, targetFile: string) {
    await DebugEngine.fixError(logFile, targetFile);
  }

  static async runGenerate() {
    // TODO: генерация кода и компонентов
    console.log('[Orchestrator] Generate');
  }

  static async runCreate(options: { db: string; frontend: string; backend: string; spec: string; projectName: string }) {
    const path = require('path');
    const fs = require('fs');
    const projectDir = path.join('projects', options.projectName);
    // Создаём структуру папок
    if (!fs.existsSync('projects')) fs.mkdirSync('projects');
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir);
    const adaptersDir = path.join(projectDir, 'src', 'adapters');
    const prismaDir = path.join(projectDir, 'prisma');
    const logsDir = path.join(projectDir, 'logs');
    if (!fs.existsSync(path.join(projectDir, 'src'))) fs.mkdirSync(path.join(projectDir, 'src'));
    if (!fs.existsSync(adaptersDir)) fs.mkdirSync(adaptersDir, { recursive: true });
    if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir);
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    // 1. Найти свободные порты для backend и frontend
    const backendPort = await findFreePort(3001, 3999);
    const frontendPort = await findFreePort(3000, 3999);
    // 2. Генерировать .env для backend
    const backendEnvPath = path.join(projectDir, '.env');
    fs.writeFileSync(backendEnvPath, `PORT=${backendPort}\n`, 'utf-8');
    // 3. Генерировать .env для frontend
    const pagesDir = path.join(projectDir, 'pages');
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir);
    const frontendEnvPath = path.join(pagesDir, '.env');
    fs.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_API_URL=http://localhost:${backendPort}\n`, 'utf-8');
    // 1. Генерируем Prisma schema
    const schema = await PrismaGenerator.generateSchema(options.spec);
    PrismaAdapter.writeSchema(schema, projectDir);
    // 2. Сброс миграций и базы после генерации schema.prisma
    await PrismaAdapter.resetMigrations(projectDir);
    // 3. Миграция Prisma
    PrismaAdapter.runMigrate(projectDir);
    // 4. Генерация API
    await ApiGenerator.generateCrud(schema, projectDir);
    // 4.1. Генерация index.js для роутеров
    const adaptersIndexJs = `// @ts-nocheck\nconst express = require('express');\nconst fs = require('fs');\nconst path = require('path');\n\nconst router = express.Router();\nconst adaptersDir = __dirname;\nconst files = fs.readdirSync(adaptersDir);\nfor (const file of files) {\n  if (file.endsWith('Router.ts') && file !== 'index.js') {\n    const r = require(path.join(adaptersDir, file));\n    router.use(r.default || r);\n  }\n}\n\nmodule.exports = router;\n`;
    const adaptersIndexPath = path.join(adaptersDir, 'index.js');
    fs.writeFileSync(adaptersIndexPath, adaptersIndexJs, 'utf-8');
    // 5. Генерация фронтенда
    await FrontendGenerator.generateComponents(options.spec, projectDir);
    // 6. Генерация тестов
    await TestGenerator.generateTests(options.spec, projectDir);
    // Генерируем package.json для проекта
    const projectPackageJson = {
      name: options.projectName,
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        api: 'ts-node src/adapters/server.ts',
        test: 'jest'
      },
      dependencies: {
        next: '^15.3.5',
        react: '^19.1.0',
        'react-dom': '^19.1.0',
        express: '^5.1.0',
        prisma: '^6.11.1',
        '@prisma/client': '^6.11.1',
        'ts-node': '^10.9.2',
        typescript: '^5.8.3',
        dotenv: '^17.2.0',
        jest: '^30.0.4'
      }
    };
    const fsPath = require('path').join(projectDir, 'package.json');
    fs.writeFileSync(fsPath, JSON.stringify(projectPackageJson, null, 2), 'utf-8');
    // Генерируем server.ts для backend
    const serverTemplate = fs.readFileSync('templates/server.ts.txt', 'utf-8');
    const serverPath = require('path').join(projectDir, 'src', 'adapters', 'server.ts');
    fs.writeFileSync(serverPath, serverTemplate, 'utf-8');
    // Генерируем минимальный frontend (pages/index.tsx)
    const indexTemplate = fs.readFileSync('templates/index.tsx.txt', 'utf-8');
    const indexPath = require('path').join(pagesDir, 'index.tsx');
    fs.writeFileSync(indexPath, indexTemplate, 'utf-8');
    console.log(`[Orchestrator] Проект создан в ${projectDir}!`);
  }
} 