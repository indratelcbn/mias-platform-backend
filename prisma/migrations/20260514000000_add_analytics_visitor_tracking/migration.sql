-- CreateTable VisitorLog
CREATE TABLE "visitor_logs" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "page_path" TEXT NOT NULL,
    "full_url" TEXT NOT NULL,
    "browser" TEXT,
    "browser_version" TEXT,
    "operating_system" TEXT,
    "os_version" TEXT,
    "device_type" TEXT,
    "device_name" TEXT,
    "referrer" TEXT,
    "user_agent" TEXT,
    "language" TEXT,
    "screen_width" INTEGER,
    "screen_height" INTEGER,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable DailyAnalytics (aggregated daily data)
CREATE TABLE "daily_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_visitors" INTEGER NOT NULL DEFAULT 0,
    "unique_visitors" INTEGER NOT NULL DEFAULT 0,
    "total_pageviews" INTEGER NOT NULL DEFAULT 0,
    "bounce_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_session_duration" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable PopularPages
CREATE TABLE "popular_pages" (
    "id" TEXT NOT NULL,
    "page_path" TEXT NOT NULL,
    "page_title" TEXT,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "unique_views" INTEGER NOT NULL DEFAULT 0,
    "avg_duration" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "bounce_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "last_viewed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popular_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable DeviceStatistics
CREATE TABLE "device_statistics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "device_type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable BrowserStatistics
CREATE TABLE "browser_statistics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "browser" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable OSStatistics
CREATE TABLE "os_statistics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "operating_system" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable ReferrerStatistics
CREATE TABLE "referrer_statistics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "referrer" TEXT NOT NULL,
    "referrer_type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrer_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable VisitorHourlyHeatmap
CREATE TABLE "visitor_hourly_heatmap" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "visitor_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_hourly_heatmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for faster queries
CREATE INDEX "visitor_logs_created_at_idx" ON "visitor_logs"("created_at");
CREATE INDEX "visitor_logs_session_id_idx" ON "visitor_logs"("session_id");
CREATE INDEX "visitor_logs_ip_address_idx" ON "visitor_logs"("ip_address");
CREATE INDEX "visitor_logs_page_path_idx" ON "visitor_logs"("page_path");
CREATE UNIQUE INDEX "daily_analytics_date_key" ON "daily_analytics"("date");
CREATE INDEX "popular_pages_page_path_idx" ON "popular_pages"("page_path");
CREATE INDEX "device_statistics_date_device_idx" ON "device_statistics"("date", "device_type");
CREATE INDEX "browser_statistics_date_browser_idx" ON "browser_statistics"("date", "browser");
CREATE INDEX "os_statistics_date_os_idx" ON "os_statistics"("date", "operating_system");
CREATE INDEX "referrer_statistics_date_idx" ON "referrer_statistics"("date");
CREATE INDEX "visitor_hourly_heatmap_date_idx" ON "visitor_hourly_heatmap"("date");
CREATE INDEX "visitor_hourly_heatmap_date_hour_idx" ON "visitor_hourly_heatmap"("date", "hour");
