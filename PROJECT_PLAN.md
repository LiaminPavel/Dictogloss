# PROJECT PLAN — English Dictation App
# Передай этот документ агенту в Cursor и скажи: "Read this plan completely, then start Phase 0."

---

## 🎭 РОЛИ АГЕНТОВ — ПРОЧИТАЙ ПЕРЕД СТАРТОМ

Ты работаешь как команда из пяти специалистов одновременно.
Перед каждым решением думай: что скажет каждый из них?

**Lead Architect — Алекс**
Отвечает за структуру всего проекта. Принимает финальные решения по архитектуре.
Девиз: "Если это сложно объяснить — значит это сделано неправильно."

**Security Engineer — Макс**
Проверяет каждый эндпоинт, каждую форму, каждую переменную окружения.
Девиз: "Параноя — это профессионализм."

**Backend Engineer — Дима**
Строит API, работает с базой данных, интегрирует внешние сервисы.
Девиз: "Если нет обработки ошибок — код не написан."

**Frontend Engineer — Аня**
Строит UI который работает в любом браузере, на любом экране.
Девиз: "Пользователь не должен думать — интерфейс должен быть очевиден."

**DevOps Engineer — Серёга**
Отвечает за деплой, переменные окружения, Digital Ocean, CI/CD.
Девиз: "Работает на моей машине — не считается."

---

## 📋 ОПИСАНИЕ ПРОЕКТА

### Кто заказчик
Преподаватель английского языка. Не технический человек.
Создаёт упражнения для своих учеников — диктанты на слух.

### Что делает приложение

**Преподаватель (Admin):**
- Логинится в защищённую админку
- Вставляет текст (набор предложений)
- Выбирает голос и акцент (американский, британский, разные голоса)
- Нажимает "Сгенерировать" — система озвучивает каждое предложение через OpenAI TTS
- Получает уникальную ссылку на урок
- Отправляет ссылку ученикам
- Видит статистику: кто прошёл, какой процент правильных ответов

**Ученик (Student):**
- Переходит по ссылке — никакой регистрации не нужно (или опциональная)
- Вводит своё имя перед стартом
- Видит интерфейс диктанта: поле для ввода текста
- Нажимает Play — слышит предложение
- Может прослушать максимум 3 раза
- Пишет то что услышал
- Нажимает Enter для проверки
- Если правильно: ✅ зелёная галочка → автоматически следующее предложение
- Если неправильно: ❌ красный крестик → показывается правильный текст → кнопка Continue
- Регистр, точки, запятые — всё учитывается при проверке
- В конце видит итоговый результат: X из Y правильно

### Что важно технически
- Работает в Chrome, Firefox, Safari, Edge — любые браузеры
- Работает на мобильном телефоне
- Аудио генерируется один раз при создании урока — не при каждом прослушивании
- Ссылка на урок уникальная, можно делиться
- Преподаватель видит результаты учеников

---

## 🗄️ СХЕМА БАЗЫ ДАННЫХ
```prisma
// Используй это как основу. Перед реализацией — проверь через Context7
// актуальный синтаксис Prisma schema.

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed, min 12 rounds
  name          String
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // soft delete
  lessons       Lesson[]  // lessons created by this user (admin)
  attempts      LessonAttempt[] // attempts by this user (student)
}

enum Role {
  ADMIN
  STUDENT
}

model Lesson {
  id          String     @id @default(cuid())
  title       String
  shareToken  String     @unique @default(cuid()) // уникальный токен для ссылки
  createdBy   User       @relation(fields: [userId], references: [id])
  userId      String
  voice       String     // openai voice: alloy, echo, fable, onyx, nova, shimmer
  accent      String     // american, british — для отображения в UI
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?
  sentences   Sentence[]
  attempts    LessonAttempt[]
}

model Sentence {
  id          String    @id @default(cuid())
  lessonId    String
  lesson      Lesson    @relation(fields: [lessonId], references: [id])
  order       Int       // порядок предложения в уроке
  text        String    // оригинальный текст
  audioUrl    String?   // URL в DO Spaces после генерации
  audioStatus AudioStatus @default(PENDING)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  answers     StudentAnswer[]
}

enum AudioStatus {
  PENDING     // ещё не сгенерировано
  PROCESSING  // генерируется сейчас
  READY       // готово
  FAILED      // ошибка генерации
}

model LessonAttempt {
  id          String    @id @default(cuid())
  lessonId    String
  lesson      Lesson    @relation(fields: [lessonId], references: [id])
  userId      String?   // null если ученик без регистрации
  user        User?     @relation(fields: [userId], references: [id])
  studentName String    // имя которое ввёл ученик
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  totalScore  Int?      // количество правильных ответов
  totalCount  Int?      // всего предложений
  answers     StudentAnswer[]
}

model StudentAnswer {
  id            String        @id @default(cuid())
  attemptId     String
  attempt       LessonAttempt @relation(fields: [attemptId], references: [id])
  sentenceId    String
  sentence      Sentence      @relation(fields: [sentenceId], references: [id])
  studentText   String        // что написал ученик
  isCorrect     Boolean
  playCount     Int           @default(0) // сколько раз прослушал (max 3)
  answeredAt    DateTime      @default(now())
}
```

---

## 🏗️ ФАЗЫ РАЗРАБОТКИ

---

### PHASE 0 — SETUP (День 1)
**Цель: рабочая основа проекта, всё настроено, ничего не сломано**

#### 0.1 Инициализация проекта
```bash
# Агент выполняет последовательно:
npx create-next-app@latest dictation-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd dictation-app
```

#### 0.2 Установка зависимостей
```
# Перед каждой установкой — проверь актуальную версию через Context7

Core:
- prisma + @prisma/client
- next-auth (v5 / auth.js)
- bcryptjs + @types/bcryptjs
- zod
- @anthropic-ai/sdk
- openai

Storage:
- @aws-sdk/client-s3 (для DO Spaces — S3-совместимый)

UI:
- lucide-react
- clsx
- tailwind-merge

Dev:
- @types/node
- prisma (dev dependency)
```

#### 0.3 Создать Memory Bank
Создать папку `/memory-bank/` и все 5 файлов:

**memory-bank/projectbrief.md:**
```
# Project Brief — English Dictation App

## What
Web application for English language teachers.
Teachers create audio dictation exercises, students complete them.

## Users
- Admin (Teacher): creates lessons, generates audio, shares links, sees results
- Student: follows shared link, listens to audio, types sentences, gets feedback

## Core Flow
1. Teacher pastes sentences → selects voice → system generates audio via OpenAI TTS
2. Teacher shares unique link
3. Student opens link → enters name → listens (max 3x) → types → gets feedback
4. Teacher sees results in admin panel

## Key Rules
- Max 3 listens per sentence
- Exact match check: case, punctuation all matter
- Wrong answer: show correct text + Continue button
- Right answer: auto-advance to next sentence
- Audio generated once, stored in DO Spaces

## Tech Stack
- Next.js 14, TypeScript, Prisma, PostgreSQL
- NextAuth.js v5
- OpenAI TTS for audio
- Claude API for any AI processing
- Digital Ocean App Platform + DO Spaces
- Tailwind CSS
```

**memory-bank/progress.md:**
```
# Progress

## Status: Phase 0 — Setup

## Completed
- [ ] Project initialized
- [ ] Dependencies installed
- [ ] Memory bank created
- [ ] .env.local configured
- [ ] Database schema written
- [ ] .cursorrules created

## In Progress
- Phase 0 setup

## Next
- Phase 1: Database + Auth

## Known Issues
- None yet
```

#### 0.4 Настройка переменных окружения
Создать `.env.local`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dictation_app"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."

# Digital Ocean Spaces (S3-compatible)
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_REGION="nyc3"
DO_SPACES_BUCKET="dictation-app-audio"
DO_SPACES_KEY="..."
DO_SPACES_SECRET="..."
DO_SPACES_CDN_URL="https://dictation-app-audio.nyc3.cdn.digitaloceanspaces.com"
```

Убедиться что `.env.local` есть в `.gitignore` — **проверить до первого коммита**.

#### 0.5 Создать `.cursorrules`
Скопировать содержимое из файла `.cursorrules` который был создан ранее.

#### 0.6 Инициализация Prisma и базы данных
```bash
npx prisma init
# Скопировать схему из раздела DATABASE выше в prisma/schema.prisma
npx prisma migrate dev --name init
npx prisma generate
```

#### 0.7 Seed — начальные данные
Создать `prisma/seed.ts`:
```typescript
// Создать одного admin пользователя для преподавателя
// email: admin@dictation.app
// password: Admin123! (bcrypt, 12 rounds)
// role: ADMIN
```

**✅ Критерий завершения Phase 0:**
- `npm run dev` запускается без ошибок
- Prisma Studio показывает схему (`npx prisma studio`)
- `.env.local` в `.gitignore`
- Memory bank создан и заполнен
- `.cursorrules` создан

---

### PHASE 1 — AUTH (День 1-2)
**Цель: работающая авторизация, защищённые роуты**

#### 1.1 NextAuth конфигурация
Перед написанием кода — проверить через Context7 актуальный синтаксис NextAuth v5.

Файлы для создания:
```
/lib/auth/config.ts      — конфигурация NextAuth
/lib/auth/utils.ts       — хелперы: getCurrentUser, requireAdmin, etc.
/app/api/auth/[...nextauth]/route.ts
```

Требования:
- Credentials provider (email + password)
- Проверка пароля через bcrypt
- Session содержит: id, email, name, role
- JWT стратегия

#### 1.2 Middleware для защиты роутов
Создать `middleware.ts` в корне:
```
Защищённые роуты:
- /admin/*     → только role === ADMIN
- /api/admin/* → только role === ADMIN, возвращает 401 иначе

Публичные роуты:
- /             → лендинг
- /auth/*       → логин
- /lesson/*     → страница урока для студентов (по shareToken)
- /api/lesson/* → API для студентов
```

#### 1.3 Страницы авторизации
```
/app/(auth)/login/page.tsx
```
UI требования:
- Форма: email + password
- Валидация через Zod на клиенте
- Обработка ошибок: неверный пароль, пользователь не найден
- Редирект после логина: admin → /admin/dashboard
- Никакой регистрации через UI — только через seed или прямое создание admin

#### 1.4 Тест авторизации
- Логин с правильными данными → редирект в /admin
- Логин с неверным паролем → ошибка
- Прямой доступ к /admin без логина → редирект на /login
- API /api/admin/* без сессии → 401

**✅ Критерий завершения Phase 1:**
- Логин работает
- /admin недоступен без авторизации
- Сессия сохраняется между перезагрузками

---

### PHASE 2 — ADMIN PANEL (День 2-3)
**Цель: преподаватель может создать урок и сгенерировать аудио**

#### 2.1 Layout и навигация админки
```
/app/(admin)/layout.tsx
- Хедер с именем пользователя и кнопкой logout
- Боковое меню: Уроки | Создать урок | Статистика
- Защита через middleware (уже настроено)
```

#### 2.2 Dashboard
```
/app/(admin)/admin/dashboard/page.tsx
- Список всех уроков преподавателя
- Для каждого урока: название, дата, статус аудио, количество прохождений
- Кнопки: Открыть | Скопировать ссылку | Удалить (soft delete)
```

#### 2.3 Создание урока
```
/app/(admin)/admin/lessons/new/page.tsx
```

UI компоненты:
```
1. Поле "Название урока"
2. Большой textarea "Вставьте предложения"
   - Каждое предложение на новой строке
   - Показывать счётчик предложений в реальном времени
   - Предпросмотр списка предложений под textarea
3. Выбор голоса — красивые карточки:
   - 🇺🇸 American English
     - Alloy (нейтральный)
     - Nova (женский)
     - Onyx (мужской)
   - 🇬🇧 British English
     - Echo (нейтральный)
     - Fable (выразительный)
     - Shimmer (женский)
4. Кнопка "Создать и сгенерировать аудио"
```

Логика при нажатии "Создать":
```
1. Валидация: название не пустое, минимум 1 предложение
2. POST /api/admin/lessons → создать Lesson + Sentences в БД
3. POST /api/admin/lessons/:id/generate → запустить генерацию аудио
4. Показать прогресс: "Генерируется аудио... 3 из 10"
5. После завершения: показать ссылку на урок
```

#### 2.4 Генерация аудио — API
```
/app/api/admin/lessons/route.ts       — создание урока
/app/api/admin/lessons/[id]/route.ts  — получение, удаление урока
/app/api/admin/lessons/[id]/generate/route.ts — генерация аудио
```

Логика генерации:
```typescript
// Для каждого предложения:
// 1. Вызов OpenAI TTS API — проверить синтаксис через Context7 перед написанием
// 2. Получить audio buffer
// 3. Загрузить в DO Spaces: audio/{lessonId}/{sentenceId}.mp3
// 4. Сохранить URL в Sentence.audioUrl
// 5. Обновить Sentence.audioStatus = READY
// 6. Если ошибка: audioStatus = FAILED, продолжить с следующим

// Модель: tts-1 (быстрее) или tts-1-hd (качественнее)
// Формат: mp3
// Голоса OpenAI: alloy, echo, fable, onyx, nova, shimmer
```

#### 2.5 Страница урока в админке
```
/app/(admin)/admin/lessons/[id]/page.tsx
- Список предложений с статусами аудио
- Ссылка для учеников с кнопкой "Скопировать"
- Статистика прохождений
- Таблица результатов учеников
```

**✅ Критерий завершения Phase 2:**
- Преподаватель создаёт урок
- Аудио генерируется для каждого предложения
- Ссылка на урок создаётся
- Список уроков отображается на dashboard

---

### PHASE 3 — STUDENT INTERFACE (День 3-4)
**Цель: ученик проходит диктант от начала до конца**

#### 3.1 Страница входа в урок
```
/app/lesson/[shareToken]/page.tsx
```

Логика:
```
1. Найти урок по shareToken
2. Если не найден — красивая страница "Урок не найден"
3. Если найден — показать:
   - Название урока
   - Количество предложений
   - Поле "Введите ваше имя"
   - Кнопка "Начать"
4. При нажатии "Начать" — создать LessonAttempt в БД
5. Перейти к первому предложению
```

#### 3.2 Интерфейс диктанта — главный экран
```
/app/lesson/[shareToken]/practice/page.tsx
```

UI — детальные требования:
```
┌─────────────────────────────────────┐
│  Предложение 3 из 10                │
│  ██████████░░░░░░░░░░  30%          │
├─────────────────────────────────────┤
│                                     │
│    🔊  [    PLAY    ]               │
│         Осталось прослушиваний: 2   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Печатайте здесь...            │  │
│  └───────────────────────────────┘  │
│                                     │
│  [     Проверить (Enter)     ]      │
└─────────────────────────────────────┘
```

Состояния интерфейса:

**Состояние 1: Ожидание ответа**
- Кнопка Play активна (если playCount < 3)
- Поле ввода активно
- Кнопка "Проверить" или Enter для отправки

**Состояние 2: Правильный ответ**
```
┌─────────────────────────────────────┐
│  ✅ Правильно!                      │
│                                     │
│  Следующее предложение через 2...   │
└─────────────────────────────────────┘
```
→ Автоматический переход через 2 секунды

**Состояние 3: Неправильный ответ**
```
┌─────────────────────────────────────┐
│  ❌ Неправильно                     │
│                                     │
│  Вы написали:                       │
│  "the quick brown fox"              │
│                                     │
│  Правильно:                         │
│  "The quick brown fox."             │
│                                     │
│  [        Continue        ]         │
└─────────────────────────────────────┘
```

**Состояние 4: Лимит прослушиваний исчерпан**
- Play кнопка становится серой и неактивной
- Текст: "Вы исчерпали лимит прослушиваний"

#### 3.3 Логика проверки ответа
```typescript
// Точное сравнение строк
// Учитывается: регистр, точки, запятые, все знаки препинания
// Trim пробелов по краям — единственное послабление

function checkAnswer(studentText: string, correctText: string): boolean {
  return studentText.trim() === correctText.trim()
}

// Пример:
// "The cat sat." vs "the cat sat" → ❌ НЕПРАВИЛЬНО
// "The cat sat." vs "The cat sat." → ✅ ПРАВИЛЬНО
```

#### 3.4 Финальный экран
```
/app/lesson/[shareToken]/results/page.tsx

┌─────────────────────────────────────┐
│  🎉 Диктант завершён!               │
│                                     │
│  Результат: 7 из 10                 │
│  ████████████████░░░░  70%          │
│                                     │
│  ✅ Предложение 1                   │
│  ✅ Предложение 2                   │
│  ❌ Предложение 3                   │
│  ✅ Предложение 4                   │
│  ...                                │
│                                     │
│  [    Попробовать ещё раз    ]      │
└─────────────────────────────────────┘
```

При загрузке страницы:
- Обновить LessonAttempt.completedAt = now()
- Обновить LessonAttempt.totalScore и totalCount

#### 3.5 API для студентов
```
GET  /api/lesson/[shareToken]              — данные урока (без правильных текстов!)
POST /api/lesson/[shareToken]/attempt      — создать попытку
POST /api/lesson/[shareToken]/answer       — проверить ответ
GET  /api/lesson/[shareToken]/audio/[id]   — получить presigned URL для аудио
```

⚠️ ВАЖНО: API не должен возвращать правильные тексты предложений клиенту до проверки ответа. Проверка происходит только на сервере.

**✅ Критерий завершения Phase 3:**
- Ученик открывает ссылку → вводит имя → проходит все предложения → видит результат
- Лимит 3 прослушивания работает
- Enter отправляет ответ
- Автоматический переход при правильном ответе
- Кнопка Continue при неправильном

---

### PHASE 4 — STATISTICS (День 4-5)
**Цель: преподаватель видит кто как прошёл урок**

#### 4.1 Dashboard обновление
```
/app/(admin)/admin/dashboard/page.tsx — обновить
Добавить карточки статистики:
- Всего уроков
- Всего прохождений
- Средний результат
```

#### 4.2 Страница статистики урока
```
/app/(admin)/admin/lessons/[id]/stats/page.tsx

Таблица результатов:
| Имя ученика | Дата | Результат | % правильных |
|-------------|------|-----------|--------------|
| Anna K.     | 12 Mar | 8/10   | 80%          |
| Boris M.    | 12 Mar | 5/10   | 50%          |

Детали по предложениям:
| # | Предложение | % правильных ответов |
|---|-------------|----------------------|
| 1 | The cat...  | 90%                  |
| 2 | She went... | 45%                  |
```

#### 4.3 API статистики
```
GET /api/admin/lessons/[id]/stats
- Список всех попыток
- Для каждого предложения: количество правильных/неправильных ответов
- Только для ADMIN
```

**✅ Критерий завершения Phase 4:**
- Преподаватель видит список учеников прошедших урок
- Видит результат каждого ученика
- Видит статистику по каждому предложению

---

### PHASE 5 — DEPLOY (День 5-6)
**Цель: приложение работает в интернете**

#### 5.1 Подготовка к деплою

Создать файл `.env.production.example`:
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-domain.com
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DO_SPACES_ENDPOINT=
DO_SPACES_REGION=
DO_SPACES_BUCKET=
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_CDN_URL=
```

Создать `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Создать `.dockerignore`:
```
node_modules
.next
.env.local
.env*.local
```

#### 5.2 Настройка Digital Ocean — пошагово

**Шаг 1: База данных**
```
1. Зайди в Digital Ocean → Databases
2. Create Database Cluster
3. PostgreSQL версия 15
4. Plan: Basic ($15/месяц для старта)
5. Region: выбери ближайший к тебе
6. Скопируй Connection String → это твой DATABASE_URL
```

**Шаг 2: Spaces (хранилище аудио)**
```
1. Digital Ocean → Spaces Object Storage
2. Create Space
3. Имя: dictation-app-audio
4. Region: тот же что и БД
5. Restrict file listing: YES (важно для безопасности)
6. Settings → CORS:
   Origin: https://your-domain.com
   Methods: GET
7. API Keys → Generate New Key
8. Сохрани Key и Secret
```

**Шаг 3: App Platform**
```
1. Digital Ocean → App Platform
2. Create App
3. Source: GitHub → выбери репозиторий
4. Branch: main
5. Autodeploy: YES
6. Build settings:
   - Build Command: npm run build
   - Run Command: npm start
7. Environment Variables → добавить ВСЕ из .env.production.example
8. Plan: Basic ($12/месяц для старта)
```

**Шаг 4: Запуск миграций**
```
После первого деплоя:
1. App Platform → Console (или SSH)
2. npx prisma migrate deploy
3. npx prisma db seed
```

**Шаг 5: Проверка**
```
1. Открыть URL приложения
2. Войти с admin@dictation.app / Admin123!
3. Создать тестовый урок
4. Открыть ссылку в другом браузере как студент
5. Пройти диктант
```

#### 5.3 GitHub Actions — автодеплой
```yaml
# .github/workflows/deploy.yml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to DO App Platform
        # DO App Platform автоматически деплоит при push в main
        # Этот файл нужен для запуска миграций
      - name: Run migrations
        run: echo "Migrations run automatically on DO"
```

**✅ Критерий завершения Phase 5:**
- Приложение доступно по публичному URL
- Логин работает
- Можно создать урок
- Ученик может пройти диктант
- Аудио воспроизводится

---

## 🔒 SECURITY CHECKLIST
Агент проверяет это перед каждым деплоем:
```
[ ] .env.local не попал в git (проверить git log)
[ ] Все API роуты проверяют сессию
[ ] Admin роуты проверяют role === ADMIN
[ ] Правильные тексты НЕ отправляются клиенту до проверки
[ ] Аудио файлы недоступны напрямую (только presigned URLs)
[ ] Пароли хешируются bcrypt 12 rounds
[ ] Zod валидация на всех входящих данных
[ ] Rate limiting на /api/lesson/* (защита от перебора)
[ ] CORS настроен на DO Spaces
[ ] NEXTAUTH_SECRET — случайная строка минимум 32 символа
```

---

## 📁 ИТОГОВАЯ СТРУКТУРА ПРОЕКТА
```
dictation-app/
├── .cursorrules                 ← правила для агентов
├── .env.local                   ← секреты (не в git!)
├── .env.production.example      ← шаблон для продакшена
├── .gitignore
├── Dockerfile
├── PROJECT_PLAN.md              ← этот файл
├── memory-bank/
│   ├── projectbrief.md
│   ├── activeContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   └── progress.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── lessons/
│   │       │   ├── new/
│   │       │   └── [id]/
│   └── lesson/
│       └── [shareToken]/
│           ├── page.tsx         ← ввод имени
│           ├── practice/        ← диктант
│           └── results/         ← финальный экран
├── components/
│   ├── ui/
│   ├── admin/
│   └── student/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validations/
│   ├── audio/
│   ├── ai/
│   └── storage/
└── middleware.ts
```

---

## 🚀 КОМАНДА ДЛЯ СТАРТА

Скопируй это и отправь агенту в Cursor как первое сообщение:
```
Read PROJECT_PLAN.md completely from start to finish.
Then read all files in /memory-bank/ if they exist.
Use Context7 to verify current versions of all libraries before installing.
Use Sequential Thinking MCP to plan Phase 0 before executing.

Start Phase 0. 
Report progress after each sub-step.
Ask me if anything is unclear before building.
Respond in Russian.
```

---

## ❓ ВОПРОСЫ КОТОРЫЕ АГЕНТ ЗАДАСТ — ОТВЕТЫ ЗАРАНЕЕ

**Q: Нужна ли регистрация для учеников?**
A: Нет. Ученик вводит только имя перед стартом. Регистрация не нужна.

**Q: Может ли ученик пройти урок несколько раз?**
A: Да. Каждое нажатие "Попробовать ещё раз" создаёт новую попытку.

**Q: Нужен ли таймер на ответ?**
A: Нет. Ученик может думать сколько угодно.

**Q: Что если аудио не сгенерировалось для одного предложения?**
A: Показать ошибку на этом предложении, дать возможность продолжить к следующему.

**Q: Нужны ли уведомления по email?**
A: Нет. MVP без email.

**Q: Мобильная версия?**
A: Да, обязательно. Tailwind mobile-first.