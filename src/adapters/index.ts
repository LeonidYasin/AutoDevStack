import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const adaptersDir = __dirname;
const files = fs.readdirSync(adaptersDir);
for (const file of files) {
  if (file.endsWith('Router.ts') && file !== 'index.ts') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const r = require(path.join(adaptersDir, file));
    router.use(r.default || r);
  }
}

export default router; 