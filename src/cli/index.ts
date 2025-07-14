#!/usr/bin/env ts-node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { Orchestrator } from '../core/orchestrator';
import readline from 'readline';
import { AIService } from '../services/aiService';
import path from 'path';
import fs from 'fs';
import { InferenceClient } from '@huggingface/inference';
dotenv.config();

const program = new Command();

program
  .name('autodevstack')
  .description('AI-ассистент для генерации, тестирования и автофикса кода')
  .version('0.1.0');

function handleError(e: any) {
  console.error('\x1b[31m[Ошибка]\x1b[0m', e.message || e);
  process.exit(1);
}

program
  .command('fix <logFile> <targetFile>')
  .description('Автоматически исправить ошибку по логам')
  .action(async (logFile, targetFile) => {
    try {
      await Orchestrator.runFix(logFile, targetFile);
    } catch (e) {
      handleError(e);
    }
  });

program
  .command('generate')
  .description('Генерация кода и компонентов')
  .action(async () => {
    try {
      await Orchestrator.runGenerate();
    } catch (e) {
      handleError(e);
    }
  });

program
  .command('create')
  .description('Создать проект по текстовому описанию')
  .option('--db <db>', 'Тип БД', 'postgres')
  .option('--frontend <frontend>', 'Фронтенд', 'nextjs')
  .option('--backend <backend>', 'Бэкенд', 'express')
  .option('--spec <spec>', 'Текстовое описание спецификации')
  .option('--name <name>', 'Имя проекта (папка в projects/)')
  .action(async (opts) => {
    try {
      const projectName = opts.name || `project-${Date.now()}`;
      await Orchestrator.runCreate({ ...opts, projectName });
      // Автозапуск сервера после генерации
      const path = require('path');
      const { spawn, execSync } = require('child_process');
      const projectDir = path.join('projects', projectName);
      console.log(`[AutoDevStack] Установка зависимостей в ${projectDir}...`);
      // Установка зависимостей, включая concurrently
      try {
        execSync('npm install concurrently', { cwd: projectDir, stdio: 'inherit', shell: true });
        execSync('npm install', { cwd: projectDir, stdio: 'inherit', shell: true });
      } catch (e: any) {
        console.error(`[AutoDevStack][ERR] Ошибка при установке зависимостей: ${e.message}`);
      }
      // Добавляем скрипт start в package.json для запуска backend и frontend через concurrently
      const pkgPath = path.join(projectDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.scripts.start = 'concurrently "npm:api" "npm:dev"';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      // Запуск start-скрипта (оба процесса в фоне)
      console.log(`[AutoDevStack] Запуск backend и frontend (npm run start) в ${projectDir}...`);
      const start = spawn('npm', ['run', 'start'], { cwd: projectDir, shell: true, detached: true, stdio: 'ignore' });
      start.unref();
    } catch (e) {
      handleError(e);
    }
  });

program
  .command('chat')
  .description('Интерактивный чат с ИИ для генерации и доработки проекта')
  .option('--name <name>', 'Имя проекта (папка в projects/)')
  .action(async (opts) => {
    const projectName = opts.name || `project-${Date.now()}`;
    const projectDir = path.join('projects', projectName);
    if (!fs.existsSync('projects')) fs.mkdirSync('projects');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir);
      fs.mkdirSync(path.join(projectDir, 'src'));
      fs.mkdirSync(path.join(projectDir, 'src', 'adapters'));
      fs.mkdirSync(path.join(projectDir, 'prisma'));
      fs.mkdirSync(path.join(projectDir, 'logs'));
    }
    const historyFile = path.join(projectDir, 'chat_history.txt');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const token = process.env.HF_TOKEN;
    if (!token) {
      console.error('HF_TOKEN не найден в .env');
      process.exit(1);
    }
    const model = 'deepseek-ai/DeepSeek-V3-0324';
    const projectContext = 'Проект: AutoDevStack. Это генератор fullstack-приложений (PostgreSQL + Express + React + Prisma + Next.js + Cypress + CLI) с поддержкой AI, автотестами и автофиксом.';
    const assistantRole = 'Я — управляющий и эксперт по проекту AutoDevStack. Я знаю всё о его архитектуре, возможностях, командах и могу управлять генерацией, тестированием и автофиксом кода. Задавайте вопросы или поручения — я всё сделаю!';
    const client = new InferenceClient(token);
    let messages = [
      { role: 'system', content: projectContext },
      { role: 'assistant', content: assistantRole }
    ];
    console.log(`💬 [${projectName}] Введите команду (exit для выхода):`);
    const ask = () => {
      rl.question('> ', async (q) => {
        if (q.trim().toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        messages.push({ role: 'user', content: q });
        fs.appendFileSync(historyFile, `USER: ${q}\n`);
        try {
          console.log('[DEBUG][DeepSeek] chatCompletion:', JSON.stringify({ model, messages }, null, 2));
          const response = await client.chatCompletion({ model, messages });
          const msg = response.choices?.[0]?.message;
          messages.push({ role: msg?.role || 'assistant', content: msg?.content || '' });
          fs.appendFileSync(historyFile, `AI: ${JSON.stringify(msg, null, 2)}\n`);
          console.log(`[AutoDevStack][${msg.role}] (${model}):\n${msg.content}`);
        } catch (e: any) {
          console.error('[DeepSeek][Ошибка]:', e.message);
        }
        ask();
      });
    };
    ask();
  });

program
  .command('update-models')
  .description('Обновить рейтинг лучших моделей Hugging Face для всех задач (best_models.json)')
  .action(async () => {
    const { selectBestModels } = await import('./hf_select_best_models');
    await selectBestModels();
  });

program.parse(process.argv); 