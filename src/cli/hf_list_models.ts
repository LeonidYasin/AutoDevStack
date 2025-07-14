import axios from 'axios';
import { HF_TOKEN, ensureHfToken } from '../services/hfConfig';
import fs from 'fs';
import path from 'path';
export const BEST_MODELS_PATH = path.join(process.cwd(), 'best_models.json');
ensureHfToken();

async function listModels() {
  const url = 'https://huggingface.co/api/models?full=true';
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    Accept: 'application/json',
  };
  try {
    const res = await axios.get(url, { headers });
    const models = res.data;
    if (!Array.isArray(models)) {
      console.error('Неожиданный ответ:', models);
      process.exit(3);
    }
    const lines = models.map((m: any) => `${m.id} | ${m.pipeline_tag || '-'} | ${m.private ? 'private' : 'public'}`);
    fs.writeFileSync('models_list.txt', lines.join('\n') + `\n\nВсего моделей: ${models.length}\n`, 'utf-8');
    for (const line of lines.slice(0, 20)) {
      console.log(line);
    }
    if (models.length > 20) {
      console.log(`... (ещё ${models.length - 20} моделей, полный список в models_list.txt)`);
    }
    console.log(`\nВсего моделей: ${models.length}`);
  } catch (e: any) {
    console.error('Ошибка:', e.message);
    process.exit(4);
  }
}

async function getAllModels() {
  const url = 'https://huggingface.co/api/models?full=true';
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    Accept: 'application/json',
  };
  const res = await axios.get(url, { headers });
  if (!Array.isArray(res.data)) throw new Error('Неожиданный ответ Hugging Face API');
  return res.data;
}

export { getAllModels };

listModels(); 