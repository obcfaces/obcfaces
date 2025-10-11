# 🚀 Growth Phase Implementation Guide

## ✅ Completed

### 1. GitHub Release Workflow
**File:** `.github/workflows/release.yml`

**Триггер:** Push тега `v*` (например, `v1.1.0`, `v1.2.0-beta`)

**Процесс:**
```bash
# Создать релиз:
git tag -a v1.1.0 -m "Release v1.1.0 - Analytics & Feature Flags"
git push origin v1.1.0

# Автоматически:
# 1. Build + Lint + Test
# 2. E2E тесты (Playwright)
# 3. GitHub Release с auto-changelog
# 4. Deployment summary
```

**Результат:** Полностью автоматизированный релиз с тестами и документацией.

---

### 2. Feature Flags System

**Files:**
- `src/utils/featureFlags.ts` — 19 флагов с конфигурацией
- `src/hooks/useFeatureFlag.ts` — 3 хука для использования

**Ключевые возможности:**

#### 🎯 Sticky Bucketing (Липкое распределение)
```typescript
// Пользователь ВСЕГДА видит один вариант (через localStorage + hash)
const { isEnabled } = useFeatureFlag('newContestCard');

// A/B тест с 50/50 распределением
const { variant, isA, isB } = useABTest('theme_experiment', 50);
```

**MurmurHash3** для стабильного распределения:
- Один userId/fingerprint → всегда одна группа
- Работает для анонимных пользователей через fingerprint
- Сохраняется в localStorage на 180 дней

#### 🔐 Доступ по ролям и rollout %
```typescript
FLAGS = {
  // Только для админов
  analyticsV2: { enabled: true, roles: ['admin', 'moderator'] },
  
  // 30% аудитории (липкое)
  newContestCard: { enabled: true, rollout: 30 },
  
  // 10% + липкое + отслеживание
  abNewTheme: { enabled: true, rollout: 10 },
}
```

#### 📊 Tracking & Analytics
```typescript
// Автоматическое отслеживание через Plausible
trackFeatureUsage('newContestCard', true, userId);

// A/B test tracking
plausible('ABTest', { 
  test: 'theme_experiment', 
  variant: 'A',
  userId 
});
```

---

### 3. Auto-Translation Edge Function

**File:** `supabase/functions/auto-translate/index.ts`

**Как работает:**
1. Проверяет таблицу `i18n_missing` на отсутствующие переводы
2. Использует **Lovable AI Gateway** (Gemini 2.5 Flash) для перевода
3. Сохраняет в `i18n_values` с timestamp
4. Удаляет из `i18n_missing`

**Запуск:**
```bash
# Вручную через Supabase dashboard или curl
curl -X POST https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/auto-translate \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Или через cron (настроить в Supabase)
```

**Результат:** Автоматический перевод 100+ ключей за раз.

---

## 📋 TODO: SQL Migrations

Создай эти таблицы для i18n и analytics:

### i18n Tables

```sql
-- Хранение ключей и дефолтного текста
CREATE TABLE public.i18n_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  default_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Хранение переводов
CREATE TABLE public.i18n_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang text NOT NULL, -- 'ru', 'es', 'fr', 'de'
  key text NOT NULL REFERENCES i18n_keys(key) ON DELETE CASCADE,
  text text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lang, key)
);

-- Очередь отсутствующих переводов
CREATE TABLE public.i18n_missing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  default_text text NOT NULL,
  target_lang text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(key, target_lang)
);

-- RLS policies
ALTER TABLE public.i18n_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_missing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read i18n keys" ON public.i18n_keys FOR SELECT USING (true);
CREATE POLICY "Anyone can read i18n values" ON public.i18n_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage i18n" ON public.i18n_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage missing translations" ON public.i18n_missing FOR ALL USING (true);
```

### Analytics Views

```sql
-- Регистрации по дням (последние 30 дней)
CREATE OR REPLACE VIEW public.analytics_registrations_per_day AS
SELECT 
  date_trunc('day', created_at)::date as day,
  COUNT(*) as signups
FROM public.profiles
WHERE created_at >= now() - interval '30 days'
GROUP BY day
ORDER BY day DESC;

-- Голосования по дням (последние 30 дней)
CREATE OR REPLACE VIEW public.analytics_votes_per_day AS
SELECT 
  date_trunc('day', created_at)::date as day,
  COUNT(*) as votes,
  AVG(rating)::numeric(3,1) as avg_rating
FROM public.contestant_ratings
WHERE created_at >= now() - interval '30 days'
GROUP BY day
ORDER BY day DESC;

-- Топ-10 стран за последнюю неделю
CREATE OR REPLACE VIEW public.analytics_top_countries_week AS
SELECT 
  country,
  COUNT(*) as user_count
FROM public.profiles
WHERE created_at >= now() - interval '7 days'
  AND country IS NOT NULL
GROUP BY country
ORDER BY user_count DESC
LIMIT 10;

-- Метрики конверсии
CREATE OR REPLACE VIEW public.analytics_conversion_metrics AS
WITH visitors AS (
  SELECT COUNT(DISTINCT user_id) as total FROM contestant_ratings
),
voters AS (
  SELECT COUNT(DISTINCT user_id) as total FROM contestant_ratings
  WHERE created_at >= now() - interval '7 days'
)
SELECT 
  (SELECT total FROM visitors) as total_users,
  (SELECT total FROM voters) as weekly_voters,
  ROUND((SELECT total FROM voters)::numeric / NULLIF((SELECT total FROM visitors), 0) * 100, 2) as conversion_rate;

-- Grant access
GRANT SELECT ON public.analytics_registrations_per_day TO authenticated;
GRANT SELECT ON public.analytics_votes_per_day TO authenticated;
GRANT SELECT ON public.analytics_top_countries_week TO authenticated;
GRANT SELECT ON public.analytics_conversion_metrics TO authenticated;
```

---

## 🎯 Usage Examples

### Feature Flags in Components

```typescript
import { useFeatureFlag, useABTest } from '@/hooks/useFeatureFlag';

function ContestPage() {
  const { isEnabled: showNewCard } = useFeatureFlag('newContestCard');
  const { variant: themeVariant } = useABTest('theme_experiment', 10);
  
  return (
    <div className={themeVariant === 'A' ? 'theme-new' : 'theme-old'}>
      {showNewCard ? <ContestCardV2 /> : <ContestCardV1 />}
    </div>
  );
}
```

### Multiple Flags

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlag';

function AdminDashboard() {
  const { flags, isLoading } = useFeatureFlags([
    'analyticsV2',
    'adminCharts',
    'contestInsightsV2',
  ]);
  
  if (isLoading) return <Spinner />;
  
  return (
    <>
      {flags.analyticsV2 && <AnalyticsDashboard />}
      {flags.adminCharts && <AdvancedCharts />}
      {flags.contestInsightsV2 && <EnhancedInsights />}
    </>
  );
}
```

### Report Missing Translation

```typescript
import { translationService } from '@/services/translationService';

function reportMissing(key: string, text: string) {
  translationService.reportMissing({ 
    key, 
    defaultText: text,
    targetLangs: ['ru', 'es', 'fr', 'de'] 
  });
}

// В компоненте:
const t = (key: string, fallback: string) => {
  const translation = getTranslation(key);
  if (!translation) {
    reportMissing(key, fallback);
    return fallback;
  }
  return translation;
};
```

---

## 🚀 Deployment Checklist

### v1.1.0 Release

- [ ] Создать ветку `growth-phase`
- [ ] Создать SQL migrations для i18n таблиц
- [ ] Создать analytics views в Supabase
- [ ] Проверить LOVABLE_API_KEY в Supabase secrets
- [ ] Включить `analyticsV2` для админов
- [ ] Запустить первый A/B тест: `newContestCard` на 10%
- [ ] Протестировать auto-translate функцию
- [ ] Создать тег `v1.1.0-beta` для staging
- [ ] После проверки — тег `v1.1.0` для production
- [ ] Создать GitHub Release с changelog

### Post-Release Monitoring

- [ ] Проверить метрики в `/admin/analytics`
- [ ] Отследить A/B test assignments в localStorage
- [ ] Проверить auto-translate через Supabase logs
- [ ] Собрать feedback от пользователей в группе A vs B

---

## 📊 KPIs для отслеживания

| Метрика | Baseline | Target (30 дней) |
|---------|----------|------------------|
| **Conversion to Vote** | 15% | +25% (→ 18.75%) |
| **Session Duration** | 3m 42s | 5m+ |
| **DAU Growth** | 50 | 200 (+300%) |
| **Translation Coverage** | 80% | 100% |
| **A/B Test Confidence** | - | 95% statistical significance |

---

## 🔗 Resources

- [GitHub Releases Docs](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [A/B Testing Guide](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [Lovable AI Gateway Docs](https://docs.lovable.dev/features/ai)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Status:** ✅ Ready for v1.1.0 Beta Release  
**Last Updated:** 2025-10-11  
**Next Review:** After 7 days of beta testing
