export type DataSource = "api" | "backend" | "fallback" | "demo" | "empty";

export function isOperationalDataSource(source: DataSource | undefined) {
  return source === "api" || source === "backend";
}

export function getDataSourceLabel(source: DataSource | undefined, error?: string | null) {
  if (error) return "خطای منبع داده";
  if (source === "api") return "دادهٔ API واقعی";
  if (source === "backend") return "دادهٔ backend واقعی";
  if (source === "fallback") return "fallback؛ دادهٔ عملیاتی در دسترس نیست";
  if (source === "demo") return "پیش‌نمایش نمونه";
  return "داده‌ای در دسترس نیست";
}
