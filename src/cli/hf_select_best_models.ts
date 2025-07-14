import { getAllModels, BEST_MODELS_PATH } from './hf_list_models';
import { ensureHfToken } from '../services/hfConfig';
import fs from 'fs';

// Критерии выбора лучших моделей
const MIN_LIKES = 100;
const EXCLUDE_NSFW = true;
const EXCLUDE_DEPRECATED = true;
const EXCLUDE_PRIVATE = true;
const EXCLUDE_GATED = true;

function isModelAvailable(model: any) {
  if (EXCLUDE_DEPRECATED && model.deprecated) return false;
  if (EXCLUDE_NSFW && model.safetags && model.safetags.includes('nsfw')) return false;
  if (EXCLUDE_PRIVATE && model.private) return false;
  if (EXCLUDE_GATED && model.gated) return false;
  if (model.likes < MIN_LIKES) return false;
  if (!model.pipeline_tag) return false;
  return true;
}

function explain(model: any) {
  return `Модель: ${model.id}\nЛайки: ${model.likes}\nЗагрузки: ${model.downloads}\nPipeline: ${model.pipeline_tag}\nПоследнее обновление: ${model.lastModified}\n${model.private ? 'private' : 'public'}${model.gated ? ', gated' : ''}${model.deprecated ? ', deprecated' : ''}`;
}

async function selectBestModels() {
  ensureHfToken();
  const models = await getAllModels();
  const byTask: Record<string, any[]> = {};
  for (const m of models) {
    if (!isModelAvailable(m)) continue;
    if (!byTask[m.pipeline_tag]) byTask[m.pipeline_tag] = [];
    byTask[m.pipeline_tag].push(m);
  }
  const best: Record<string, any> = {};
  for (const task in byTask) {
    // Сортировка: лайки, downloads, дата
    byTask[task].sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      if (b.downloads !== a.downloads) return b.downloads - a.downloads;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });
    best[task] = {
      id: byTask[task][0].id,
      explain: explain(byTask[task][0]),
      meta: {
        likes: byTask[task][0].likes,
        downloads: byTask[task][0].downloads,
        lastModified: byTask[task][0].lastModified,
        private: byTask[task][0].private,
        gated: byTask[task][0].gated,
        deprecated: byTask[task][0].deprecated,
      }
    };
  }
  const result = {
    last_updated: new Date().toISOString(),
    best,
  };
  fs.writeFileSync(BEST_MODELS_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log('Лучшие модели по задачам сохранены в', BEST_MODELS_PATH);
  for (const task in best) {
    console.log(`\n[${task}]\n${best[task].explain}`);
  }
}

export { selectBestModels };

if (require.main === module) {
  selectBestModels();
} 