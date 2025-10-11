# Smoke Tests Checklist 🧪

## ✅ Роутинг и Редиректы

### Базовые редиректы
- [ ] `/ph` → редиректит на `/{savedLang}-ph` (по умолчанию `/en-ph`)
- [ ] `/contest` → редиректит на `/{savedLang}-{savedCc}/contest`
- [ ] `/EN-PH` (верхний регистр) → нормализуется к `/en-ph`
- [ ] `/En-Ph` (смешанный регистр) → нормализуется к `/en-ph`

### Query параметры при редиректах
- [ ] `/ph?gender=female` → редирект сохраняет query: `/en-ph?gender=female`
- [ ] `/contest?age=18-25` → редирект: `/{lang}-{cc}/contest?age=18-25`

### Locale validation
- [ ] `/xx-zz` (неизвестная локаль) → показывает `LocaleFallback` с кнопкой "Switch to Default"
- [ ] `/invalid-locale-format` → редирект на `/en-ph`
- [ ] Корректная локаль `/en-ph/contest` → работает нормально

### Trailing slash
- [ ] `/en-ph/contest/` (с хвостовым слешем) → canonical без дублей

---

## ✅ URL-Фильтры

### Синхронизация с URL
- [ ] Изменение фильтра Gender → URL обновляется: `?gender=female`
- [ ] Изменение Age → добавляется: `?gender=female&age=18-25`
- [ ] Сброс фильтра (All Ages) → параметр удаляется из URL
- [ ] Изменение View Mode → `?view=full`

### Browser History
- [ ] Кнопка "Назад" → восстанавливает предыдущее состояние фильтров
- [ ] Кнопка "Вперёд" → восстанавливает следующее состояние
- [ ] История корректно работает через несколько изменений фильтров

### Прямые ссылки
- [ ] `/en-ph/contest?gender=female&age=18-25` → страница открывается с применёнными фильтрами
- [ ] Фильтры в UI синхронизированы с параметрами из URL
- [ ] Данные отфильтрованы согласно URL параметрам

---

## ✅ Батч-Рейтинги

### Network Analysis (DevTools)
- [ ] **Без батчинга**: N отдельных запросов `get_public_participant_rating_stats`
- [ ] **С батчингом**: 1 запрос на список ID участников
- [ ] Батч-запрос содержит все ID участников в массиве
- [ ] Ответ возвращает массив статистики для всех ID

### Performance
- [ ] При пагинации/скролле: батч обновляется корректно
- [ ] При смене фильтров: новый батч-запрос с отфильтрованными ID
- [ ] Кеширование: повторный просмотр той же страницы использует кеш (60 секунд)

### Integration
- [ ] `useRatingStatsBatch()` hook корректно работает
- [ ] `ParticipantsService.getParticipantStatsBulk()` вызывается с массивом ID
- [ ] Статистика корректно маппится к карточкам участников

---

## ✅ Виртуализация

### Trigger условия
- [ ] Списки ≤ 50 карточек: стандартный grid рендер
- [ ] Списки > 50 карточек: включается виртуализация
- [ ] `VirtualizedList` компонент используется для больших списков

### Performance
- [ ] DOM: рендерятся только видимые карточки (~10-15 элементов)
- [ ] Скролл: плавный, без тормозов
- [ ] Карточки подгружаются при скролле без задержек
- [ ] Memory usage: не растёт при скролле длинных списков

### Visual
- [ ] Правильная высота контейнера
- [ ] Карточки не перекрываются
- [ ] Правильное позиционирование элементов

---

## ✅ Turnstile CAPTCHA

### Integration points
- [ ] `/auth` (логин) → показывает Turnstile перед входом
- [ ] `/account` (регистрация) → Turnstile перед созданием аккаунта
- [ ] Голосование (vote) → `VotingWithTurnstile` компонент

### Verification flow
- [ ] Без токена → 403 Forbidden
- [ ] С неверным токеном → 403 Forbidden  
- [ ] С валидным токеном → 200 OK, действие выполнено
- [ ] После успеха: токен invalid для повторного использования

### Rate Limiting
- [ ] "Залп" запросов → сначала Turnstile challenge
- [ ] После Turnstile → rate limit срабатывает: 429 Too Many Requests
- [ ] Response header `Retry-After` присутствует при 429
- [ ] Frontend показывает правильное сообщение об ошибке

### UI/UX
- [ ] Modal с Turnstile widget корректно отображается
- [ ] Кнопка "Cancel" работает
- [ ] После успеха: modal закрывается, toast с подтверждением
- [ ] При ошибке: toast с описанием ошибки

---

## ✅ SEO

### Canonical URLs
- [ ] `/en-ph/contest` → `<link rel="canonical" href="https://obcface.com/en-ph/contest">`
- [ ] `/ru-kz/contest` → canonical включает локаль
- [ ] **Никогда** не `/contest` без префикса локали

### Hreflang
- [ ] Все поддерживаемые локали присутствуют:
  - `<link rel="alternate" hreflang="en-PH" href="...">`
  - `<link rel="alternate" hreflang="ru-KZ" href="...">`
  - `<link rel="alternate" hreflang="es-MX" href="...">`
  - и т.д. для всех `PRIORITY_LOCALES`
- [ ] `<link rel="alternate" hreflang="x-default" href=".../en-ph...">`
- [ ] Path без дублей: `/en-ph/contest`, не `/en-ph/contest/contest`

### Open Graph
- [ ] `<meta property="og:url" content="https://obcface.com/en-ph/contest">`
- [ ] `<meta property="og:locale" content="en_PH">`
- [ ] `og:title` и `og:description` корректны

### Validation
- [ ] Google Search Console: canonical корректны
- [ ] Rich Results Test: разметка валидна
- [ ] Lighthouse SEO score: ≥ 90

---

## 🔧 Краевые Случаи

### Регистр
- [ ] `/EN-PH` → `/en-ph`
- [ ] `/En-Ph` → `/en-ph`
- [ ] `/eN-pH` → `/en-ph`

### Слеши
- [ ] `/en-ph/` → canonical без trailing slash
- [ ] `/en-ph/contest/` → canonical: `/en-ph/contest`
- [ ] Двойные слеши: `/en-ph//contest` → нормализуются

### Query при редиректах
- [ ] `/contest?gender=female` → `/{lang}-{cc}/contest?gender=female`
- [ ] `/ph?view=full` → `/en-ph?view=full`
- [ ] Query параметры не теряются при редиректах

### Rate Limits (IPv6)
- [ ] Лимиты учитывают `/56` префикс, не только полный адрес
- [ ] NAT/CGNAT не ломают логику лимитов
- [ ] Разные пользователи за одним NAT: лимиты раздельные

### Неизвестные параметры
- [ ] `/en-ph/contest/week-999` → 404 или fallback на текущую неделю
- [ ] `/en-ph/contest?unknownParam=123` → игнорируется, страница работает
- [ ] Неизвестная локаль: `LocaleFallback` компонент

---

## 📊 Метрики & Мониторинг

### Logs
- [ ] 429 логи по endpoints: `/api/vote`, `/api/login`, `/api/otp`
- [ ] 403 логи (failed Turnstile): детали ошибки логируются
- [ ] Suspicious activity: логи IP, fingerprint, timestamp

### Performance Metrics
- [ ] p95 response time `/contestants`: < 500ms
- [ ] Батч-рейтинги cache hit rate: > 80%
- [ ] Database query count на страницу: ≤ 5 запросов
- [ ] Time to First Byte (TTFB): < 200ms

### Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] INP (Interaction to Next Paint): < 200ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

### Lighthouse (Mobile)
- [ ] Performance: ≥ 90
- [ ] Accessibility: ≥ 95
- [ ] Best Practices: ≥ 95
- [ ] SEO: ≥ 95

---

## ✅ Release Checklist

- [ ] `/cc` и `/contest` редиректы сохраняют query
- [ ] Фильтры работают через URL (с Back/Forward)
- [ ] Один батч-запрос рейтингов на список ID
- [ ] Виртуализация активна при > 50 карточек
- [ ] Canonical и hreflang корректны на всех локалях
- [ ] Turnstile + rate limit защищают от спама
- [ ] Неизвестные локали/недели → корректный fallback
- [ ] Все smoke tests passed ✅
- [ ] Performance metrics в пределах нормы
- [ ] Security scan пройден без критичных issues

---

## 🚀 Next Steps

После прохождения всех тестов:
1. Deploy to staging
2. Run full E2E test suite
3. Security penetration testing
4. Load testing (100+ concurrent users)
5. Deploy to production
6. Monitor metrics for first 24 hours

---

## 📝 Notes

**Приоритет исправлений:**
1. 🔴 Critical (блокируют release): Turnstile, Rate Limits, Canonical URLs
2. 🟡 High (желательно): Батч-рейтинги, Виртуализация, Query при редиректах
3. 🟢 Medium (можно после): Trailing slashes, IPv6 edge cases, Метрики

**Известные ограничения:**
- Виртуализация работает только для списков > 50 элементов
- Батч-рейтинги кешируются на 60 секунд
- Turnstile challenge может занимать 2-5 секунд
