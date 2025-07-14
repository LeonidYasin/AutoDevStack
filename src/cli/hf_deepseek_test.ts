import dotenv from 'dotenv';
dotenv.config();
import { InferenceClient } from '@huggingface/inference';

async function main() {
  const token = process.env.HF_TOKEN;
  if (!token) {
    console.error('HF_TOKEN не найден в .env');
    process.exit(1);
  }
  const client = new InferenceClient(token);
  const model = 'deepseek-ai/DeepSeek-V3-0324';
  // Длинная история сообщений
  const messages = [
    { role: 'system', content: 'Тестовый запрос к DeepSeek. Ответь на русском: кто ты?' },
    { role: 'assistant', content: 'Я управляющий AutoDevStack.' },
    { role: 'user', content: 'Ты говоришь по-русски?' },
    { role: 'assistant', content: 'Да, я говорю по-русски.' },
    { role: 'user', content: 'Что ты умеешь?' },
    { role: 'assistant', content: 'Я умею генерировать код, отвечать на вопросы, помогать с AutoDevStack.' },
    { role: 'user', content: 'Какой стек у AutoDevStack?' },
    { role: 'assistant', content: 'TypeScript, Node.js, Express, React, Prisma, Next.js, Cypress.' },
    { role: 'user', content: 'Как создать проект?' },
    { role: 'assistant', content: 'Используй команду create.' },
    { role: 'user', content: 'Кто ты?' }
  ];
  console.log('[DEBUG][TEST] chatCompletion:', JSON.stringify({ model, messages }, null, 2));
  try {
    const response = await client.chatCompletion({ model, messages });
    console.log('[DEBUG][TEST] Ответ:', JSON.stringify(response, null, 2));
  } catch (e: any) {
    console.error('[DEBUG][TEST] Ошибка:', e.message);
  }
}

main(); 