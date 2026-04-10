import { createContext, useContext, useState } from "react";

export type Lang = "ru" | "en";

const DICT_RAW = {
  ru: {
    dashboard:    "Дашборд",
    flags:        "Флаги",
    audit:        "Аудит",
    eval:         "Eval API",
    settings:     "Настройки",
    live:         "Онлайн",
    connecting:   "Подключение",
    logout:       "Выйти",
    theme:        "Сменить тему",
    totalFlags:   "Всего флагов",
    activeInProd: "Активны в Prod",
    auditEvents:  "Событий аудита",
    envStatus:    "Статус по окружениям",
    recentEvents: "Последние события",
    minutesAgo:   "мин назад",
    hoursAgo:     "ч назад",
    daysAgo:      "д назад",
    flagName:     "Название",
    flagKey:      "Ключ",
    targeting:    "Таргетинг",
    rollout:      "Rollout",
    status:       "Статус",
    createFlag:   "Создать флаг",
    deleteFlag:   "Удалить",
    noFlags:      "Флаги не найдены",
    searchFlags:  "Поиск флагов...",
    event:        "Событие",
    flag:         "Флаг",
    environment:  "Окружение",
    actor:        "Актор",
    change:       "Изменение",
    time:         "Время",
    last50:       "Последние 50 событий",
    evalTitle:    "Eval API",
    evalDesc:     "Используй этот endpoint для оценки флагов из любого сервиса:",
    response:     "Ответ",
    cacheStats:   "Cache Stats",
    hits:         "Хиты",
    misses:       "Промахи",
    hitRate:      "Hit Rate",
    entries:      "Записей",
    environments: "Окружения",
    envName:      "Название",
    envKey:       "Ключ",
    apiKey:       "API Key",
    copyKey:      "Скопировать",
    rotateKey:    "Сбросить",
    demo:         "Демо",
    techStack:    "Технологии",
    roadmap:      "Дорожная карта",
    architecture: "Архитектура",
    startTour:    "Начать тур",
    tourNext:     "Далее",
    tourPrev:     "Назад",
    tourSkip:     "Пропустить",
    tourFinish:   "Готово",
    tourStepOf:   "из",
    tourStep0Title: "Dashboard: метрики",
    tourStep0Desc:  "Общее число флагов, активные в production, события аудита. Данные обновляются в реальном времени через SSE без перезагрузки страницы.",
    tourStep1Title: "Multi-environment",
    tourStep1Desc:  "Три независимых окружения: dev, staging, production. Флаг может быть включен в staging для тестирования и выключен в production. Прогресс-бары показывают долю активных флагов.",
    tourStep2Title: "Feature Flags: CRUD + toggle",
    tourStep2Desc:  "Таблица флагов с поиском, фильтрами (All / Active / Stale / Archived) и per-environment toggle. При переключении происходит атомарный INSERT...ON CONFLICT DO UPDATE в PostgreSQL.",
    tourStep3Title: "Создание флага",
    tourStep3Desc:  "При создании флага автоматически генерируются FlagState для каждого окружения (isEnabled=false, rolloutWeight=100). Событие CREATE записывается в аудит-лог.",
    tourStep4Title: "Eval API: кеш и rollout",
    tourStep4Desc:  "GET /eval/:apiKey возвращает map { flagKey: bool }. In-memory кеш с TTL 5 мин и dual index (envIndex + projIndex) для инвалидации. Rollout через CRC32(flagID) % 100.",
    tourStep5Title: "SSE: EventBus",
    tourStep5Desc:  "Зелёный индикатор = активное SSE-соединение. При connect отправляется SNAPSHOT текущего состояния, затем стримятся FLAG_CHANGE события. На фронте инвалидируется кеш TanStack Query.",
    tourStep6Title: "Аудит-лог с пагинацией",
    tourStep6Desc:  "Каждое действие (CREATE, DELETE, TOGGLE, UPDATE_RULES) записывается с актором, diff payload и окружением. Пагинация на бэкенде через limit/offset.",
    tourStep7Title: "API Key management",
    tourStep7Desc:  "Окружения с API-ключами для /eval endpoint. Ключи генерируются через crypto.randomUUID. Ротация создает новый ключ, старый перестает работать мгновенно.",
    page:          "Страница",
    of:            "из",
    prev:          "Назад",
    next:          "Далее",
    totalRecords:  "Всего записей",
    demoHeroTitle:    "Под капотом",
    demoHeroDesc:     "Демонстрационный проект управления feature flags. Обзор архитектуры, стека технологий и дорожной карты.",
    demoCurrentStack: "Текущий стек",
    demoFutureStack:  "В планах",
    demoCta:          "Пройти интерактивный тур по приложению",
  },
  en: {
    dashboard:    "Dashboard",
    flags:        "Feature Flags",
    audit:        "Audit Log",
    eval:         "Eval API",
    settings:     "Settings",
    live:         "Live",
    connecting:   "Connecting",
    logout:       "Logout",
    theme:        "Toggle theme",
    totalFlags:   "Total flags",
    activeInProd: "Active in Prod",
    auditEvents:  "Audit events",
    envStatus:    "Environment status",
    recentEvents: "Recent events",
    minutesAgo:   "min ago",
    hoursAgo:     "h ago",
    daysAgo:      "d ago",
    flagName:     "Name",
    flagKey:      "Key",
    targeting:    "Targeting",
    rollout:      "Rollout",
    status:       "Status",
    createFlag:   "Create flag",
    deleteFlag:   "Delete",
    noFlags:      "No flags found",
    searchFlags:  "Search flags...",
    event:        "Event",
    flag:         "Flag",
    environment:  "Environment",
    actor:        "Actor",
    change:       "Change",
    time:         "Time",
    last50:       "Last 50 events",
    evalTitle:    "Eval API",
    evalDesc:     "Use this endpoint to evaluate flags from any service:",
    response:     "Response",
    cacheStats:   "Cache Stats",
    hits:         "Hits",
    misses:       "Misses",
    hitRate:      "Hit Rate",
    entries:      "Entries",
    environments: "Environments",
    envName:      "Name",
    envKey:       "Key",
    apiKey:       "API Key",
    copyKey:      "Copy",
    rotateKey:    "Rotate",
    demo:         "Demo",
    techStack:    "Tech Stack",
    roadmap:      "Roadmap",
    architecture: "Architecture",
    startTour:    "Start Tour",
    tourNext:     "Next",
    tourPrev:     "Back",
    tourSkip:     "Skip",
    tourFinish:   "Finish",
    tourStepOf:   "of",
    tourStep0Title: "Dashboard: Metrics",
    tourStep0Desc:  "Total flags, active in production, audit events. Data updates in real-time via SSE without page reload.",
    tourStep1Title: "Multi-environment",
    tourStep1Desc:  "Three independent environments: dev, staging, production. A flag can be enabled in staging for testing and disabled in production. Progress bars show the ratio of active flags.",
    tourStep2Title: "Feature Flags: CRUD + Toggle",
    tourStep2Desc:  "Flag table with search, filters (All / Active / Stale / Archived) and per-env toggle. Toggle executes an atomic INSERT...ON CONFLICT DO UPDATE in PostgreSQL.",
    tourStep3Title: "Flag Creation",
    tourStep3Desc:  "On creation, FlagState records are auto-generated for each environment (isEnabled=false, rolloutWeight=100). A CREATE event is written to the audit log.",
    tourStep4Title: "Eval API: Cache & Rollout",
    tourStep4Desc:  "GET /eval/:apiKey returns { flagKey: bool }. In-memory cache with 5min TTL and dual index (envIndex + projIndex) for invalidation. Rollout via CRC32(flagID) % 100.",
    tourStep5Title: "SSE: EventBus",
    tourStep5Desc:  "Green indicator = active SSE connection. On connect a SNAPSHOT of current state is sent, then FLAG_CHANGE events are streamed. Frontend invalidates TanStack Query cache.",
    tourStep6Title: "Audit Log with Pagination",
    tourStep6Desc:  "Every action (CREATE, DELETE, TOGGLE, UPDATE_RULES) is recorded with actor, diff payload and environment. Backend pagination via limit/offset.",
    tourStep7Title: "API Key Management",
    tourStep7Desc:  "Environments with API keys for the /eval endpoint. Keys generated via crypto.randomUUID. Rotation creates a new key; the old one stops working immediately.",
    page:          "Page",
    of:            "of",
    prev:          "Prev",
    next:          "Next",
    totalRecords:  "Total records",
    demoHeroTitle:    "Under the Hood",
    demoHeroDesc:     "Feature flags management demo project. Architecture overview, tech stack and roadmap.",
    demoCurrentStack: "Current Stack",
    demoFutureStack:  "Coming Next",
    demoCta:          "Take an interactive tour of the application",
  },
};

export type Translations = (typeof DICT_RAW)["ru"];
export const DICT: Record<Lang, Translations> = DICT_RAW;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

export const LangContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
  t: DICT_RAW.ru,
});

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const stored = (
    typeof localStorage !== "undefined" ? localStorage.getItem("ff-lang") : null
  ) as Lang | null;

  const [lang, setLangState] = useState<Lang>(stored ?? "ru");

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("ff-lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICT[lang] }}>
      {children}
    </LangContext.Provider>
  );
}
