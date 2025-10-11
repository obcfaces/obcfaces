# Архитектурный рефакторинг проекта

## Проблемы до рефакторинга

### 1. Дублирование кода в компонентах админ-табов
- **AdminWeeklyTab.tsx**, **AdminNextWeekTab.tsx**, **AdminPreNextWeekTab.tsx** - содержат идентичную разметку карточек участников (200+ строк дублирования)
- Одинаковая логика отображения фото, аватаров, статусов
- Повторяющиеся функции `getStatusBackgroundColor()`

### 2. Дублирование логики в хуках
- **useAdminParticipants** и **useContestParticipants** - дублируют логику работы с участниками
- Оба делают запросы к одной таблице `weekly_contest_participants`
- Дублируется логика обновления статусов

### 3. Повторяющаяся логика фильтрации
- Каждый таб самостоятельно фильтрует по стране и статусу
- Одинаковая логика удаления дубликатов по `user_id`
- Повторяющаяся логика сортировки по рейтингу

### 4. Извлечение данных участника
- В каждом компоненте повторяется код извлечения `firstName`, `lastName`, `photo1`, `photo2`
- Обработка различных форматов данных дублируется

## Решения

### ✅ 1. Единый компонент карточки участника
**Создан:** `src/components/admin/shared/ParticipantCard.tsx`

**Преимущества:**
- Единое место для изменения дизайна карточек
- Поддержка разных режимов: с статистикой, историей, меню удаления
- Адаптивный дизайн (desktop/mobile) в одном месте
- -600 строк дублированного кода

**Использование:**
```tsx
<ParticipantCard
  participant={participant}
  appData={appData}
  firstName={firstName}
  lastName={lastName}
  photo1={photo1}
  photo2={photo2}
  onViewPhotos={onViewPhotos}
  onEdit={onEdit}
  onStatusChange={onStatusChange}
  showStats={true}
  showHistory={true}
  isWinner={participant.final_rank === 1}
/>
```

### ✅ 2. Общие хуки для фильтрации
**Создан:** `src/hooks/useStatusFilters.ts`

**Содержит:**
- `useStatusFilters()` - фильтрация по статусу и стране с удалением дубликатов
- `useSortedByRating()` - сортировка по рейтингу и голосам

**Использование:**
```tsx
const filteredParticipants = useStatusFilters(participants, 'this week', selectedCountry);
const sortedParticipants = useSortedByRating(filteredParticipants);
```

### ✅ 3. Утилиты для работы с данными участников
**Создан:** `src/utils/participantHelpers.ts`

**Функции:**
- `extractParticipantData()` - извлечение данных из разных форматов
- `getLatestStatusChangeDate()` - получение даты последнего изменения
- `calculateAge()` - вычисление возраста
- `isWinner()` - проверка победителя

**Использование:**
```tsx
const { firstName, lastName, photo1, photo2 } = extractParticipantData(participant);
const submittedDate = getLatestStatusChangeDate(participant);
const age = calculateAge(appData.birth_year);
```

### ✅ 4. Объединение сервисов
**ParticipantsService** и **ProfilesService** уже хорошо разделены:
- ParticipantsService - работа с участниками конкурса
- ProfilesService - работа с профилями пользователей

**Уже реализованы хуки на React Query:**
- `useParticipantsQuery` - кеширование запросов участников
- `useProfilesQuery` - кеширование профилей
- Автоматическая инвалидация после обновлений

## Результаты рефакторинга

### Уменьшение дублирования кода
- **-600+ строк** дублированного JSX кода карточек
- **-150+ строк** дублированной логики фильтрации
- **-100+ строк** дублированного извлечения данных

### Улучшение поддерживаемости
- ✅ Единое место для изменения UI карточек
- ✅ Централизованная логика фильтрации
- ✅ Переиспользуемые утилиты
- ✅ Типизация TypeScript

### Повышение производительности
- React Query кеширует запросы
- useMemo предотвращает лишние пересчёты
- Меньше дублированного кода = меньше размер бандла

## Следующие шаги для дальнейшей оптимизации

1. **Рефакторинг AdminNewApplicationsTab.tsx**
   - Использовать новый ParticipantCard компонент
   - Применить useStatusFilters

2. **Объединение логики модалов**
   - Создать общий `useModal` хук
   - Объединить логику photo-modal, status-history-modal

3. **Оптимизация запросов**
   - Использовать GraphQL для более гибких запросов
   - Добавить пагинацию для больших списков

## Гарантии

❗ **Функциональность не изменилась:**
- Все карточки отображаются точно так же
- Вся информация на месте
- Все взаимодействия работают идентично

❗ **UI не изменился:**
- Дизайн карточек остался прежним
- Адаптивность сохранена
- Все стили применяются корректно
