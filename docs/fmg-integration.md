# Интеграция с Fantasy Map Generator

[Azgaar Fantasy Map Generator](https://github.com/Azgaar/Fantasy-Map-Generator) (FMG) — генератор фэнтезийных карт с открытым исходным кодом. Летописец использует FMG для создания и визуализации мира.

## Способы интеграции

### Фаза 1: Статический импорт (MVP)

Простейший путь — пользователь вручную экспортирует данные из FMG.

```
1. Открыть azgaar.github.io/Fantasy-Map-Generator
2. Сгенерировать или загрузить карту
3. Экспортировать: Hamburger → Export → Full JSON
4. (Опционально) Экспортировать SVG/PNG для отображения
5. Загрузить JSON в Летописец через UI
```

### Фаза 4: Интерактивная карта (iframe + postMessage)

FMG встраивается в iframe внутри Летописца. Двусторонняя связь через `postMessage`.

```
Letopisets UI ◄──postMessage──► FMG (iframe)
     │                              │
     │  GET_MAP_DATA ──────────►    │
     │  ◄────────── MAP_DATA        │
     │                              │
     │  UPDATE_STATE ──────────►    │
     │  UPDATE_BURG ───────────►    │
     │  EXPORT_SVG ────────────►    │
     │  ◄────────── SVG_DATA        │
     │  FOCUS_ON ──────────────►    │
```

## Формат данных FMG

FMG экспортирует JSON со следующей структурой. Типы определены в `packages/shared/src/types/fmg.ts`.

### Корневой объект (`FmgMapData`)

```typescript
interface FmgMapData {
  info: FmgInfo;         // Версия, seed, имя карты
  settings: FmgSettings; // Единицы измерения, масштаб
  cells: FmgCellsData;   // Ячейки карты, биомы, фичи
  states: FmgState[];    // Государства
  burgs: FmgBurg[];      // Города
  cultures: FmgCulture[];// Культуры
  religions: FmgReligion[];// Религии
  rivers: FmgRiver[];    // Реки
  markers: FmgMarker[];  // Маркеры на карте
  notes: FmgNote[];      // Заметки
}
```

### Ключевые сущности

**FmgState** — государство:
- `i` — индекс (используется как `fmgId` в нашей БД)
- `name`, `form`, `formName` — название и форма правления
- `color` — цвет на карте
- `capital` — индекс столичного бурга
- `military` — массив военных подразделений
- `diplomacy` — массив индексов (отношения с другими государствами)
- `area`, `rural`, `urban` — территория и население

**FmgBurg** — город:
- `i` — индекс
- `name`, `state`, `culture` — привязки
- `x`, `y` — координаты на карте
- `capital` (1/0), `port` (1/0) — флаги
- `population` — население
- `citadel`, `walls`, `plaza`, `temple`, `shanty` — инфраструктура (1/0)

**FmgCulture** — культура:
- `i`, `name`, `type`, `color`
- `origins` — предки-культуры
- `expansionism` — экспансионизм

**FmgReligion** — религия:
- `i`, `name`, `type`, `form`, `deity`
- `culture` — связанная культура
- `origin` — родительская религия

## Маппинг FMG → Летописец

Парсер (`packages/fmg-bridge/parser.ts`) конвертирует данные FMG в наши сущности.

### Правила конвертации

| FMG | Летописец | Примечания |
|-----|----------|-----------|
| `states[i]` | `states` | `fmgId = i`, форма правления маппится на enum |
| `burgs[i]` | `burgs` | `fmgId = i`, `capital` и `port` → boolean |
| `cultures[i]` | `cultures` | `fmgId = i`, `type` маппится на enum |
| `religions[i]` | `religions` | `fmgId = i`, `type` маппится на enum |
| `states[i].diplomacy` | `diplomatic_relations` | Массив индексов → пары записей |
| Нет аналога | `npcs` | Генерируются ИИ-агентом после импорта |
| Нет аналога | `creatures` | Генерируются ИИ-агентом после импорта |
| Нет аналога | `trade_routes` | Генерируются на основе `rivers` и `routes` FMG |

### Маппинг формы правления

| FMG `form` | Летописец `government_form` |
|-----------|---------------------------|
| Monarchy, Kingdom, Principality | monarchy |
| Republic, Democracy, City-state | republic |
| Theocracy | theocracy |
| Tribelands, Horde | tribal |
| Empire | empire |
| (всё остальное) | anarchy |

### Маппинг типа культуры

| FMG `type` | Летописец `culture_type` |
|-----------|------------------------|
| Nomadic | nomadic |
| River | river |
| Lake | lake |
| Naval | naval |
| Hunting | hunting |
| Highland | highland |
| (всё остальное) | generic |

## Перевод названий на русский

После импорта FMG-данных все названия сущностей (государства, города, культуры, религии) можно перевести на русский через кнопку "Перевести на русский" в UI.

- **Модель**: Claude Haiku (`claude-haiku-4-5-20251001`) — экономичный (~$0.06 за весь мир)
- **Батчинг**: по 100 названий за запрос
- **Промпты**: адаптированы под тип сущности — узнаваемые слова переводятся, уникальные имена транслитерируются кириллицей
- **Оригиналы**: сохраняются в полях `name_original` / `deity_original`, отображаются в скобках в UI
- **Прогресс**: SSE-стриминг с прогресс-баром (фазы: states → cultures → religions → burgs)
- **Эндпоинт**: `POST /api/worlds/:id/translate`

## Обогащение данных ИИ

После импорта FMG-данных ИИ-агенты дополняют мир:

1. **NPC-генерация**: для каждого государства создаётся правитель и ключевые персонажи
2. **Культурные черты**: агент генерирует `traits` для каждой культуры на основе типа и окружения
3. **Религиозные заповеди**: `tenets` для каждой религии
4. **Бестиарий**: существа размещаются по биомам карты
5. **Торговые пути**: на основе портов и маршрутов FMG

## Элемент массива с индексом 0

В FMG элемент с индексом `i=0` в массивах `states`, `burgs`, `cultures`, `religions` — заглушка (нейтральная/пустая сущность). При импорте он пропускается.

```typescript
// Пропускаем элемент с индексом 0
const validStates = fmgData.states.filter(s => s.i !== 0);
```
