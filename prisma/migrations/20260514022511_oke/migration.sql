/*
  Warnings:

  - A unique constraint covering the columns `[date,browser]` on the table `browser_statistics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,device_type]` on the table `device_statistics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,operating_system]` on the table `os_statistics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[page_path]` on the table `popular_pages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,referrer]` on the table `referrer_statistics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,hour,day_of_week]` on the table `visitor_hourly_heatmap` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "browser_statistics_date_browser_idx";

-- DropIndex
DROP INDEX "device_statistics_date_device_idx";

-- DropIndex
DROP INDEX "os_statistics_date_os_idx";

-- DropIndex
DROP INDEX "visitor_hourly_heatmap_date_hour_idx";

-- CreateIndex
CREATE INDEX "browser_statistics_date_idx" ON "browser_statistics"("date");

-- CreateIndex
CREATE INDEX "browser_statistics_browser_idx" ON "browser_statistics"("browser");

-- CreateIndex
CREATE UNIQUE INDEX "browser_statistics_date_browser_key" ON "browser_statistics"("date", "browser");

-- CreateIndex
CREATE INDEX "device_statistics_date_idx" ON "device_statistics"("date");

-- CreateIndex
CREATE INDEX "device_statistics_device_type_idx" ON "device_statistics"("device_type");

-- CreateIndex
CREATE UNIQUE INDEX "device_statistics_date_device_type_key" ON "device_statistics"("date", "device_type");

-- CreateIndex
CREATE INDEX "os_statistics_date_idx" ON "os_statistics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "os_statistics_date_operating_system_key" ON "os_statistics"("date", "operating_system");

-- CreateIndex
CREATE UNIQUE INDEX "popular_pages_page_path_key" ON "popular_pages"("page_path");

-- CreateIndex
CREATE UNIQUE INDEX "referrer_statistics_date_referrer_key" ON "referrer_statistics"("date", "referrer");

-- CreateIndex
CREATE INDEX "visitor_hourly_heatmap_hour_idx" ON "visitor_hourly_heatmap"("hour");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_hourly_heatmap_date_hour_day_of_week_key" ON "visitor_hourly_heatmap"("date", "hour", "day_of_week");
