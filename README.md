# 📦 AutoDevStack

> **AI-ассистент для генерации, тестирования и автоматического исправления кода.**
> Работает на TypeScript, использует Hugging Face Inference API. Позволяет по текстовому описанию создать проект: от базы данных до фронтенда и тестов.

---

## 🔧 Основные функции

- 🧠 **AI Debug Engine** — автоматическое исправление ошибок по логам
- 🏗 **Генератор Prisma-схем** на основе текстового описания
- 📡 **Генератор API (CRUD)** для Node.js/Express
- 🖼 **Генератор Next.js/React компонентов** по описанию UI
- ✅ **Генерация Cypress-тестов**
- 🚀 **CLI-интерфейс** для запуска команд: `fix`, `generate`, `create`
- 📁 **Полная структура проекта** + поддержка шаблонов и миграций

---

## 🧠 Архитектура

```text
[CLI]
  │
  ▼
[Orchestrator] ─┬─> [DebugEngine] ← [TestRunner]
                ├─> [PostgreSQL Generator] → [Prisma]
                ├─> [API Generator]        → [Express]
                └─> [Frontend Generator]   → [Next.js] + [Cypress Tests]
```

---

## 🛠️ Используемые технологии

| Компонент    | Стек                                        |
| ------------ | ------------------------------------------- |
| Язык         | TypeScript (Node.js)                        |
| AI           | Hugging Face API (`@huggingface/inference`) |
| Модели       | DeepSeek-V3-Chat, Falcon, CodeLLaMA      |
| БД           | PostgreSQL + Prisma ORM                     |
| Backend      | Express.js (CRUD генерация)                 |
| Frontend     | Next.js + Tailwind                          |
| Тестирование | Cypress + Jest                              |
| CLI          | Commander.js                                |
| Сборка       | Docker (опционально)                        |

---

## 📁 Структура проекта

```
autodevstack/
├── src/
│   ├── cli/                  # CLI-команды (create, fix, etc)
│   ├── core/                 # Бизнес-логика (DebugEngine, Orchestrator)
│   ├── services/             # AI, файлы, контекст, шаблоны промптов
│   ├── adapters/             # Подключение к Prisma, Express, Next.js
│   ├── generators/           # Генерация компонентов, тестов, API
├── prisma/                  # schema.prisma (автогенерация)
├── templates/               # Шаблоны кода
├── logs/                    # Журналы ошибок и фиксов
├── .env                     # HF_TOKEN и др.
├── package.json
└── README.md
```

---

## ⚙️ Установка

```bash
git clone https://github.com/your-org/autodevstack
cd autodevstack
npm install
cp .env.example .env
# Вставьте свой HF_TOKEN
```

---

## 🧪 Быстрый старт

```bash
# Исправить ошибку
npx ts-node src/cli/index.ts fix logs/error.log src/app.ts

# Сгенерировать проект по описанию
npx ts-node src/cli/index.ts create \
  --db postgres \
  --frontend nextjs \
  --backend express \
  --spec "Простой блог с пользователями и постами"
```

---

## 📤 .env

```env
HF_TOKEN=hf_xxx_your_access_token
```

---

## 🔍 Основные команды

```bash
npm run fix         # Автофикс ошибок по логам
npm run generate    # Генерация кода и компонентов
npm run test        # Запуск юнит- и e2e-тестов
```

---

## 📄 Примеры prompt-ов

**DebugEngine Prompt**:

```
[КОНТЕКСТ КОДА]
...код...

[ОШИБКА]
TypeError: x is not a function

Ответ:
FILE: src/app.ts
FIX:
```typescript
// исправленный код
```
```

**Prisma Schema Prompt**:

```
Описание: "Пользователь с постами и email"
Генерируй Prisma-модель PostgreSQL со связями и индексами.
```

---

## 🧱 Принципы архитектуры

- **Модульность**: генераторы, адаптеры, сервисы разнесены по слоям
- **Инверсии зависимостей**: Orchestrator управляет всем
- **Переиспользуемость**: AIService и PromptTemplates универсальны
- **Только TypeScript**: единая экосистема
- **LLM-агностичность**: можно заменить модель при необходимости

---

## 🧩 Расширения (в планах)

- Плагин для VS Code
- Поддержка Vue/Svelte
- Генерация Dockerfile + GitHub Actions
- Веб-интерфейс генерации

---

## ✅ MVP-цель

Создание полного CRUD-приложения (PostgreSQL + Express + React) по текстовому описанию, с тестами и автофиксом ошибок, из одной CLI-команды.

---

**Готово к использованию и развитию!** 

---

## ⚙️ Переменные окружения

```env
HF_TOKEN=hf_xxx_your_access_token
HF_ENDPOINT=https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3-Chat
HF_MODEL=deepseek-ai/DeepSeek-V3-Chat
```

---

## 🚀 Запуск API

```bash
npm run api
```

---

## 🧪 Запуск тестов

```bash
npm run test
```

---

## 🧩 Расширение шаблонов

Шаблоны для генераторов лежат в папке `templates/`. Можно добавлять свои шаблоны для Express, React, тестов и т.д.

--- 