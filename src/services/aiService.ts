import { InferenceClient } from '@huggingface/inference';
import type { InferenceProviderOrPolicy } from '@huggingface/inference';
import fs from 'fs';
import path from 'path';
const BEST_MODELS_PATH = path.join(process.cwd(), 'best_models.json');

const ALLOWED_PROVIDERS = [
  "auto", "black-forest-labs", "cerebras", "cohere", "fal-ai", "featherless-ai",
  "fireworks-ai", "groq", "hf-inference", "hyperbolic", "nebius", "novita",
  "nscale", "openai", "ovhcloud", "replicate", "sambanova", "together"
] as const;

type Provider = typeof ALLOWED_PROVIDERS[number];

function toValidProvider(provider: string | undefined): InferenceProviderOrPolicy | undefined {
  if (provider && (ALLOWED_PROVIDERS as readonly string[]).includes(provider)) {
    return provider as InferenceProviderOrPolicy;
  }
  return undefined;
}

function getHfToken(): string {
  return process.env.HF_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || '';
}

const client = new InferenceClient(getHfToken());

// Маппинг моделей и поддерживаемых задач
const MODEL_TASK_MAP = [
  {
    model: 'deepseek-ai/DeepSeek-V3-0324',
    tasks: ['chat', 'conversational', 'text-generation'],
    defaultTask: 'chat',
  },
  {
    model: 'black-forest-labs/FLUX.1-dev',
    tasks: ['text-to-image'],
    defaultTask: 'text-to-image',
  },
  // Можно добавить другие модели и их задачи
];

// Используем DeepSeek как дефолтную модель для всех задач
const DEFAULT_RU_CHAT_MODEL = 'deepseek-ai/DeepSeek-V3-0324';
const DEFAULT_TEXT_GEN_MODEL = 'deepseek-ai/DeepSeek-V3-0324';
const DEFAULT_IMAGE_MODEL = 'black-forest-labs/FLUX.1-dev';

function autoSelectTaskAndModel(prompt: string, opts: AIServiceOptions): { task: string, model: string, explain?: string } {
  // 1. Определяем task по prompt/opts
  let task = opts.task;
  if (!task) {
    if (opts.messages || prompt.match(/^(кто ты|ответь|чат|диалог|talk|chat|conversation|привет|создай|управляй|проект|русск|ru)/i)) {
      task = 'chat';
    } else if (opts.imagePrompt || prompt.match(/(картинк|image|рисуй|draw|photo|picture)/i)) {
      task = 'text-to-image';
    } else {
      task = 'text-generation';
    }
  }
  // 2. Определяем model по opts или .env или best_models.json
  let model = opts.model;
  let explain: string | undefined = undefined;
  if (!model) {
    // Пытаемся загрузить best_models.json
    if (fs.existsSync(BEST_MODELS_PATH)) {
      try {
        const best = JSON.parse(fs.readFileSync(BEST_MODELS_PATH, 'utf-8'));
        if (best.best && best.best[task]) {
          model = best.best[task].id;
          explain = `[AutoSelect] Выбрана модель для задачи '${task}': ${model}\n${best.best[task].explain}\n(Обновлено: ${best.last_updated})`;
        }
      } catch (e) {
        // fallback ниже
      }
    }
    if (!model) {
      if (task === 'chat') {
        model = process.env.HF_MODEL_CHAT || DEFAULT_RU_CHAT_MODEL;
      } else if (task === 'text-to-image') {
        model = process.env.HF_MODEL_IMAGE || DEFAULT_IMAGE_MODEL;
      } else {
        model = process.env.HF_MODEL || DEFAULT_TEXT_GEN_MODEL;
      }
      explain = `[AutoSelect] Используется дефолтная модель для задачи '${task}': ${model}`;
    }
  }
  // 3. Принудительно для chat — task = 'chat'
  if (task === 'chat') task = 'chat';
  return { task, model, explain };
}

export type AIServiceOptions = {
  task?: 'chat' | 'text-generation' | 'text-to-image';
  model?: string;
  provider?: string;
  messages?: { role: string; content: string }[];
  imagePrompt?: string;
  role?: string; // Новое поле: роль ассистента
  projectContext?: string; // Новое поле: контекст проекта
};

export class AIService {
  static async callAI(prompt: string, opts: AIServiceOptions = {}): Promise<any> {
    const token = getHfToken();
    if (!token) {
      console.error('[AIService] Не найден HF_TOKEN. Установите переменную окружения HF_TOKEN или HUGGINGFACEHUB_API_TOKEN.');
      return { content: 'Ошибка: не найден HF_TOKEN. Установите переменную окружения HF_TOKEN или HUGGINGFACEHUB_API_TOKEN.', role: 'system', model: '', task: '', provider: '', raw: null };
    }
    console.log('[DEBUG][AIService] Входные параметры:', JSON.stringify({ prompt, opts }, null, 2));
    const auto = autoSelectTaskAndModel(prompt, opts);
    console.log('[DEBUG][AIService] autoSelectTaskAndModel:', JSON.stringify(auto, null, 2));
    const { task, model, explain } = auto;
    const provider = toValidProvider(opts.provider);
    const found = MODEL_TASK_MAP.find(m => m.model === model);
    if (explain) {
      console.log(explain);
    }
    // Загружаем README.md для системного контекста
    let PROJECT_README = '';
    try {
      PROJECT_README = fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8');
    } catch {}
    // Формируем контекст проекта
    const projectContext = opts.projectContext || `Проект: AutoDevStack. Это генератор fullstack-приложений (PostgreSQL + Express + React + Prisma + Next.js + Cypress + CLI) с поддержкой AI, автотестами и автофиксом.\n\nREADME:\n${PROJECT_README}`;
    // Формируем роль ассистента
    const assistantRole = opts.role || 'AutoDevStack Assistant';
    try {
      console.log('[AIService] Task:', task, '| Model:', model, '| Provider:', provider || 'auto');
      if (found && found.tasks.includes('chat') && found.tasks.length >= 2 && found.tasks.includes('conversational')) {
        // Модель поддерживает только chat/conversational — всегда chatCompletion
        const messages = opts.messages || [
          { role: 'system', content: projectContext },
          { role: 'assistant', content: `Я — управляющий и эксперт по проекту AutoDevStack. Я знаю всё о его архитектуре, возможностях, командах и могу управлять генерацией, тестированием и автофиксом кода. Задавайте вопросы или поручения — я всё сделаю!` },
          { role: 'user', content: prompt }
        ];
        console.log('[DEBUG][HF REQUEST] chatCompletion:', JSON.stringify({ model, messages, provider }, null, 2));
        const response = await client.chatCompletion({ model, messages, provider });
        const msg = response.choices?.[0]?.message;
        return {
          content: msg?.content || '',
          role: msg?.role || 'assistant',
          model,
          task,
          provider: provider || 'auto',
          raw: response
        };
      } else if (task === 'text-to-image') {
        const imagePrompt = opts.imagePrompt || prompt;
        console.log('[DEBUG][HF REQUEST] textToImage:', JSON.stringify({ model, inputs: imagePrompt, provider }, null, 2));
        const response = await client.textToImage({ model, inputs: imagePrompt, provider });
        return {
          content: '[image]',
          role: 'assistant',
          model,
          task,
          provider: provider || 'auto',
          raw: response
        };
      } else {
        // text-generation (если поддерживается)
        console.log('[DEBUG][HF REQUEST] textGeneration:', JSON.stringify({ model, inputs: `${projectContext}\n\n${prompt}`, provider }, null, 2));
        const response = await client.textGeneration({ model, inputs: `${projectContext}\n\n${prompt}`, provider });
        return {
          content: response.generated_text,
          role: 'assistant',
          model,
          task,
          provider: provider || 'auto',
          raw: response
        };
      }
    } catch (e: any) {
      console.error('[AIService] Ошибка запроса к Hugging Face:', e.message);
      return { content: `[Ошибка AIService]: ${e.message}`, role: 'system', model, task, provider: provider || 'auto', raw: null };
    }
  }
} 