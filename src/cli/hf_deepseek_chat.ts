import dotenv from 'dotenv';
dotenv.config();
import { InferenceClient } from '@huggingface/inference';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

async function main() {
  const token = process.env.HF_TOKEN;
  if (!token) {
    console.error('HF_TOKEN не найден в .env');
    process.exit(1);
  }
  const model = 'deepseek-ai/DeepSeek-V3-0324';
  const projectContext = 'Проект: AutoDevStack. Это генератор fullstack-приложений (PostgreSQL + Express + React + Prisma + Next.js + Cypress + CLI) с поддержкой AI, автотестами и автофиксом.';
  const assistantRole = 'Я — управляющий и эксперт по проекту AutoDevStack. Я знаю всё о его архитектуре, возможностях, командах и могу управлять генерацией, тестированием и автофиксом кода. Задавайте вопросы или поручения — я всё сделаю!';

  const projectName = `deepseek-chat-${Date.now()}`;
  const projectDir = path.join('projects', projectName);
  if (!fs.existsSync('projects')) fs.mkdirSync('projects');
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir);
  const historyFile = path.join(projectDir, 'chat_history.txt');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
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
        messages.push(msg);
        fs.appendFileSync(historyFile, `AI: ${JSON.stringify(msg, null, 2)}\n`);
        console.log(`[AutoDevStack][${msg.role}] (${model}):\n${msg.content}`);
      } catch (e: any) {
        console.error('[DeepSeek][Ошибка]:', e.message);
      }
      ask();
    });
  };
  ask();
}

main(); 