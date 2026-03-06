# S6 [QA] — Verification Gate 6 — Report

**Date:** 2026-03-06  
**Build:** `npm run dev` (Vite, localhost:5173)  
**Scope:** 4 скина, Skin Selector, применение, анимации, сохранение, default.

---

## Checklist results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Все 4 скина визуально различимы в Skin Selector | **FAIL** | Карточки Runner, Tank, Slim, Cube — только текст в `.skin-card-preview--placeholder`. Нет 3D-превью, нет разных цветов/форм. План: «визуальные отличия», «превью для UI» — сейчас только подписи. |
| 2 | Выбор скина применяется к персонажу в игре | **FAIL** | `Player` не принимает `skinId`: `constructor()` без аргументов. `SkinFactory` вызывает `new Player(id)`, но `Player` игнорирует id и всегда строит `createPrismaRobotModel()`. В игре всегда один и тот же персонаж (prisma-robot). TS: `SkinFactory.ts:20` — Expected 0 arguments, but got 1. |
| 3 | Все анимации корректно работают с каждым скином | **N/A** | Реальных скинов нет — один и тот же персонаж. Анимации работают с текущей моделью. |
| 4 | Выбранный скин сохраняется, после перезагрузки — тот же скин | **PASS** | `SKIN_STORAGE_KEY`, `saveSkin()` / `loadSavedSkin()` в `Game.ts`. ID сохраняется в localStorage. При перезагрузке `loadSavedSkin()` возвращает сохранённый id. |
| 5 | Default скин (Runner) при первом запуске | **PASS** | `loadSavedSkin()` при пустом localStorage возвращает `DEFAULT_PLAYER_SKIN_ID = 'runner'`. `Game` создаёт `createPlayerSkin(this.currentSkinId)`. |

---

## Итог

**Gate 6 — не пройден.**

**Причины:**

1. **SkinFactory vs Player:** `SkinFactory` имеет 4 конфига (runner, tank, slim, cube) и `getSkinConfig()`, но `Player` не использует skinId. `Player` всегда строит фиксированную модель через `createPrismaRobotModel()`. `new Player(id)` в `SkinFactory.ts:107` вызывает TS-ошибку (Player ожидает 0 аргументов).

2. **Превью в Skin Selector:** Используется `.skin-card-preview--placeholder` с текстом. Нет 3D-превью (`buildPreviewModel` из SkinFactory не подключён к UI).

3. **Визуальные отличия:** В игре все 4 «скина» выглядят одинаково, т.к. Player не применяет конфиг.

**Рекомендации:**

1. **Designer:** Переписать `Player` для приёма `skinId` и построения модели из `getSkinConfig(id)` вместо `createPrismaRobotModel()`. Либо вынести создание меша в SkinFactory и передавать готовый Group в Player.
2. **Designer:** Подключить `buildPreviewModel()` к Skin Selector (мини-canvas или статичные изображения) для визуального превью.
3. **Frontend:** Убедиться, что `Game` передаёт `loadSavedSkin()` в конструктор и что `applySkin` корректно пересоздаёт персонажа с новым skinId.
