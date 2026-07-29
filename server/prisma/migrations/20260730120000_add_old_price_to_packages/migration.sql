-- Добавляем необязательную «старую» (зачёркнутую) цену для отображения скидки.
-- Колонка nullable — существующие пакеты не затрагиваются (old_price = NULL).
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "old_price" INTEGER;
