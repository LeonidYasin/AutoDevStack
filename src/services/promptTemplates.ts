export const PromptTemplates = {
  debugEngine: ({ code, error }: { code: string; error: string }) => `
[КОНТЕКСТ КОДА]
${code}

[ОШИБКА]
${error}

Ответ:
FILE: src/app.ts
FIX:
\`\`\`typescript
// исправленный код
\`\`\`
`,
  prismaSchema: (description: string) => `
Описание: "${description}"
Генерируй Prisma-модель PostgreSQL со связями и индексами.
`,
}; 