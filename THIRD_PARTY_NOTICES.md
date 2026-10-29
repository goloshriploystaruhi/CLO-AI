# Материалы сторонних проектов

## pattern-making-skill

- Автор: Adrien Delmas, copyright © 2026.
- Репозиторий: https://github.com/adriendelmas/pattern-making-skill
- Зафиксированная версия: `6587004c4c0495592d0a3947553b52e72f1e354c`.
- Исходные материалы: `third_party/pattern-making/`.
- Полный текст лицензии MIT: `third_party/pattern-making/LICENSE`.
- Происхождение и контрольные суммы: `third_party/pattern-making/SOURCE.json`.

Методические документы используются как справочные данные. Их происхождение,
оговорки и исправления сохраняются в выдаче инструментов. Они не являются
подтверждением посадки, корректности любого чертежа или пригодности к пошиву.

`patternmaking_recipes.py` содержит адаптацию принципов основы юбки из
`skills/pattern-making/scripts/pattern.py::block_skirt`. Она использует нашу
систему миллиметров, параметры, математическую геометрию и независимую проверку;
стандартные таблицы фигур и сторонний механизм работы с CLO не подключены.

Исходный skill сохранён без изменения его методических текстов и программ.
Дополнительно скопирована корневая лицензия и добавлен `SOURCE.json`.
Подтверждённые ошибки исправляются в адаптере выдачи с отдельной отметкой,
а не незаметной заменой исходных материалов.

## tailor-dressmaker (Domain Experts)

- Copyright © 2026 Wonsuk Choi and Domain Experts contributors.
- Репозиторий: https://github.com/wonsukchoi/domain-experts
- Зафиксированная версия: `9554f15f4c20bfa121d1dc85db24cf4389c5b737`.
- Исходный каталог: `roles/tailor-dressmaker`.
- Неизменённые исходники, полная лицензия MIT и контрольные суммы:
  `third_party/tailor-dressmaker/`.

Методические разделы адаптированы в справочные карточки и инструменты
предварительной оценки. Профессиональная персона из исходного `Identity`
не присваивается ассистенту. Числа учебных примеров не используются как
индивидуальные поправки; сомнительные упрощения диагностики и расчёта
припусков заменены явно отмеченными оговорками и проверяемой арифметикой.
Исходные документы сохранены, а изменения отражены в метаданных адаптера.

## garment-patternmaking (garment-cad-mcp)

- Источник: https://github.com/0xZoharHuang/garment-cad-mcp
- Зафиксированная версия: `01660962d189d6c7d75f4c61fb673f02329fc5ab`.
- Исходный каталог: `.agents/skills/garment-patternmaking`.
- Метаданные пяти прочитанных документов и SHA-256:
  `third_party/garment-patternmaking/SOURCE.json`.

Добавлены самостоятельные русские методические карточки и реализация
сохранённых требований/проверок для существующего CLO AI. Полные сторонние
тексты, Valentina/GarmentCode SDK, исполняемые компоненты и аватары не включены.
Отдельная лицензия на skill в проверенной версии не найдена; лицензии
перечисленных upstream CAD-проектов не считаются лицензией этого skill.
Адаптация сохраняет происхождение и ограничения сведений и не подтверждает
индивидуальную посадку или готовность лекал к производству.

## Sign in with ChatGPT

Copyright 2026 OpenAI. SDK commit 0a36fefeb913055c8c7a1a29b63d82b96b2e841a; fetched from the official repository by setup. License: third_party/siwc/LICENSE. Modified response transport: app/siwc-responses.mjs. OAuth implementation is unchanged.

## Lebowski

Шрифт Pragmatica, распространяется без изменений с полным текстом оферты app/assets/fonts/License.txt.
