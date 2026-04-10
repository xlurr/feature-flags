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
    tourStep0Title: "Навигация",
    tourStep0Desc:  "Переключайтесь между разделами: дашборд, флаги, аудит, eval API и настройки.",
    tourStep1Title: "Метрики в реальном времени",
    tourStep1Desc:  "Общее число флагов, активные в production и количество событий аудита — всё обновляется через SSE.",
    tourStep2Title: "Статус окружений",
    tourStep2Desc:  "Три окружения: dev, staging, production. Каждый флаг включается независимо в каждом.",
    tourStep3Title: "Управление флагами",
    tourStep3Desc:  "CRUD операции, toggle по окружениям, поиск и фильтрация. Все изменения логируются.",
    tourStep4Title: "Аудит лог",
    tourStep4Desc:  "Полная история: кто, когда и что изменил. CREATE, DELETE, TOGGLE события.",
    tourStep5Title: "Eval API",
    tourStep5Desc:  "GET /eval/:apiKey — оценка флагов для SDK. In-memory кеш, latency < 1 мс.",
    tourStep6Title: "SSE — Real-time",
    tourStep6Desc:  "Зелёный индикатор = активное SSE-соединение. UI обновляется мгновенно при изменении флагов.",
    tourStep7Title: "i18n и тема",
    tourStep7Desc:  "Переключение языка (RU/EN) и тёмной/светлой темы. Состояние сохраняется в localStorage.",
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
    tourStep0Title: "Navigation",
    tourStep0Desc:  "Switch between sections: dashboard, flags, audit, eval API and settings.",
    tourStep1Title: "Real-time Metrics",
    tourStep1Desc:  "Total flags, active in production, audit event count — all updated via SSE.",
    tourStep2Title: "Environment Status",
    tourStep2Desc:  "Three environments: dev, staging, production. Each flag is toggled independently per env.",
    tourStep3Title: "Flag Management",
    tourStep3Desc:  "CRUD operations, per-env toggle, search & filter. All changes are audit-logged.",
    tourStep4Title: "Audit Log",
    tourStep4Desc:  "Full history: who changed what and when. CREATE, DELETE, TOGGLE events.",
    tourStep5Title: "Eval API",
    tourStep5Desc:  "GET /eval/:apiKey — flag evaluation for SDKs. In-memory cache, latency < 1ms.",
    tourStep6Title: "SSE — Real-time",
    tourStep6Desc:  "Green indicator = active SSE connection. UI updates instantly when flags change.",
    tourStep7Title: "i18n & Theme",
    tourStep7Desc:  "Language toggle (RU/EN) and dark/light theme. State persisted in localStorage.",
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
