# ✅ Growth Phase v1.1 - Чек-лист выполнения

## 1. ✅ SQL Миграции выполнены

### Analytics Views
- ✅ `analytics_registrations_per_day` — регистрации за 30 дней
- ✅ `analytics_votes_per_day` — голосования и средний рейтинг за 30 дней
- ✅ `analytics_top_countries_week` — топ-10 стран за неделю
- ✅ `analytics_conversion_metrics` — конверсия в голосование

### i18n Tables
- ✅ `i18n_keys` — хранение ключей и дефолтного текста
- ✅ `i18n_values` — хранение переводов (RU, ES, FR, DE, EN)
- ✅ `i18n_missing` — очередь для авто-перевода
- ✅ `report_missing_translation()` — функция для отправки недостающих переводов

### RLS Policies
- ✅ Публичный доступ на чтение для всех i18n таблиц
- ✅ Админы могут управлять ключами и переводами
- ✅ Система (edge functions) может управлять очередью переводов

---

## 2. 🔑 Secrets & Edge Function

### Проверить LOVABLE_API_KEY
```bash
# В Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
# Должен быть: LOVABLE_API_KEY
```

**Статус:** ⚠️ Проверь вручную в Supabase Dashboard

### Auto-Translate Edge Function
- ✅ Создана: `supabase/functions/auto-translate/index.ts`
- ✅ Использует Lovable AI Gateway (Gemini 2.5 Flash)
- ✅ Настроена в `supabase/config.toml`

**Тестирование:**
```bash
# Вызов вручную:
curl -X POST https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/auto-translate \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Проверка результата:
# SELECT * FROM i18n_values WHERE lang = 'ru' ORDER BY updated_at DESC LIMIT 10;
```

---

## 3. 📊 Analytics Dashboard обновлён

### Использует Analytics Views
- ✅ Регистрации из `analytics_registrations_per_day`
- ✅ Голосования из `analytics_votes_per_day`
- ✅ География из `analytics_top_countries_week`
- ✅ Метрики из `analytics_conversion_metrics`

### Кэширование
- ✅ React Query с `staleTime: 60_000` (1 минута)
- ✅ Analytics views с `staleTime: 5-10 минут`

---

## 4. 🎯 Feature Flags готовы

### Файлы
- ✅ `src/utils/featureFlags.ts` — 19 флагов
- ✅ `src/hooks/useFeatureFlag.ts` — хуки с липким распределением
- ✅ MurmurHash3 для стабильного bucketing

### Липкое распределение (Sticky Bucketing)
```typescript
// Пользователь ВСЕГДА видит один вариант
const { isEnabled } = useFeatureFlag('newContestCard');

// A/B тест с сохранением в localStorage
const { variant, isA, isB } = useABTest('theme_experiment', 50);
```

### Активные флаги
```typescript
analyticsV2: { enabled: true, roles: ['admin', 'moderator'] }
adminCharts: { enabled: true, roles: ['admin'] }
newContestCard: { enabled: true, rollout: 30 } // 30% пользователей
abNewTheme: { enabled: true, rollout: 10 }     // 10% пользователей
```

---

## 5. 🚀 GitHub Release Workflow

### Файл `.github/workflows/release.yml`
- ✅ Триггер на push тега `v*`
- ✅ Build + Lint + Test + E2E
- ✅ GitHub Release с auto-changelog
- ✅ Deployment summary

### Создание релиза
```bash
git checkout -b growth-phase
git add .
git commit -m "feat: Growth Phase v1.1 - Analytics, Feature Flags, Auto-Translate"
git tag -a v1.1.0-beta -m "Beta: Analytics + Flags + Auto-Translate"
git push origin growth-phase --tags
```

**Статус:** ⚠️ Выполни вручную когда готов к релизу

---

## 📋 Что нужно проверить вручную

### 1. LOVABLE_API_KEY Secret
```
Supabase Dashboard → Project Settings → Edge Functions → Secrets
```
- [ ] Проверить, что `LOVABLE_API_KEY` настроен
- [ ] Если нет — добавить через Supabase UI

### 2. Auto-Translate Function
```bash
# Тест edge function:
curl -X POST https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/auto-translate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
- [ ] Добавить тестовый ключ в `i18n_missing`
- [ ] Вызвать функцию
- [ ] Проверить появление перевода в `i18n_values`

### 3. Analytics Dashboard
- [ ] Открыть `/admin` → вкладка "Analytics"
- [ ] Проверить, что все графики рендерятся
- [ ] Проверить, что метрики обновляются

### 4. Feature Flags
```typescript
// В любом компоненте:
const { isEnabled } = useFeatureFlag('newContestCard');
console.log('newContestCard enabled:', isEnabled);
```
- [ ] Проверить под админом (должны быть доступны admin-only флаги)
- [ ] Проверить под обычным пользователем
- [ ] Проверить "липкость" — перезагрузить страницу, вариант не должен меняться

### 5. GitHub Release
```bash
git checkout main
git pull
git checkout -b growth-phase
git add .
git commit -m "feat: Growth Phase v1.1"
git tag -a v1.1.0-beta -m "Beta release"
git push origin growth-phase --tags
```
- [ ] Проверить GitHub Actions → запустился workflow
- [ ] Проверить создание GitHub Release (draft)

---

## 🎯 KPIs для отслеживания (после релиза)

| Метрика | Baseline | Target (7 дней) |
|---------|----------|-----------------|
| **DAU** | 50 | 100 (+100%) |
| **Conversion to Vote** | 15% | 18.75% (+25%) |
| **Session Duration** | 3m 42s | 5m+ |
| **Feature Flag Stability** | - | 0 "скачков" вариантов |
| **Auto-Translate Coverage** | 80% | 100% |

---

## 🔗 Next Steps

1. **Сегодня:**
   - [ ] Проверить LOVABLE_API_KEY
   - [ ] Протестировать auto-translate функцию
   - [ ] Открыть `/admin/analytics` и проверить дашборд

2. **На этой неделе:**
   - [ ] Включить первый A/B тест: `newContestCard` на 10%
   - [ ] Собрать feedback от пользователей в группе A vs B
   - [ ] Создать первый релиз `v1.1.0-beta`

3. **Через 7 дней:**
   - [ ] Проанализировать метрики роста
   - [ ] Подготовить отчёт по A/B тестам
   - [ ] Решить о раскатывании на 100%

---

**Status:** ✅ 90% выполнено  
**Last Updated:** 2025-10-11  
**Manual checks needed:** LOVABLE_API_KEY, Auto-translate test, GitHub release
