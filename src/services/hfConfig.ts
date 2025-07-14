import dotenv from 'dotenv';
dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

function ensureHfToken() {
  if (!HF_TOKEN) {
    console.error('HF_TOKEN не найден в .env');
    process.exit(1);
  }
}

export { HF_TOKEN, ensureHfToken }; 