import { execSync } from 'child_process';
import fs from 'fs';

const PRISMA_HEADER = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

export class PrismaAdapter {
  static writeSchema(schema: string, projectDir: string) {
    const path = require('path');
    let content = schema.trim();
    if (!content.includes('generator client')) {
      content = PRISMA_HEADER + '\n' + content;
    }
    const outPath = path.join(projectDir, 'prisma', 'schema.prisma');
    fs.writeFileSync(outPath, content, 'utf-8');
  }

  static runMigrate(projectDir: string) {
    const path = require('path');
    const prismaDir = path.join(projectDir, 'prisma');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit', cwd: prismaDir });
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('Drift detected') || msg.includes('reset')) {
        console.warn('[PrismaAdapter] Drift detected или требуется reset. Выполняю prisma migrate reset...');
        execSync('npx prisma migrate reset --force', { stdio: 'inherit', cwd: prismaDir });
        // После reset повторяем migrate dev
        execSync('npx prisma migrate dev --name init', { stdio: 'inherit', cwd: prismaDir });
      } else {
        throw e;
      }
    }
  }

  static async resetMigrations(projectDir: string) {
    const path = require('path');
    const prismaDir = path.join(projectDir, 'prisma');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate reset --force', { stdio: 'inherit', cwd: prismaDir });
      console.log('[PrismaAdapter] Выполнен сброс миграций и базы данных (prisma migrate reset --force)');
    } catch (e: any) {
      console.warn('[PrismaAdapter] Ошибка при сбросе миграций:', e.message);
    }
  }
} 