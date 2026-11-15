export const WEDDING_DATE = "2027-08-28T12:00:00+07:00";

export const WEDDING_PREPARATION_SHEET = "Wedding Preparation";
export const WEDDING_PREPARATION_COLUMNS = [
  "id",
  "value",
  "deadlineDate",
  "isChecked",
  "isArchived",
  "createdDate",
  "updatedDate",
] as const;

export type WeddingPreparationTask = {
  id: string;
  value: string;
  deadlineDate: string;
  isChecked: boolean;
  createdDate: string;
  updatedDate: string;
};

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export function rowsToWeddingPreparationTasks(
  columnNames: string[],
  rows: string[][],
): WeddingPreparationTask[] {
  return rows
    .map((row) => {
      const record: Record<string, unknown> = {};
      columnNames.forEach((column, index) => {
        record[column] = row[index];
      });

      const id = String(record.id ?? "");
      const value = String(record.value ?? "").trim();
      if (!id || !value || toBool(record.isArchived)) return null;

      return {
        id,
        value,
        deadlineDate: String(record.deadlineDate ?? ""),
        isChecked: toBool(record.isChecked),
        createdDate: String(record.createdDate ?? ""),
        updatedDate: String(record.updatedDate ?? ""),
      };
    })
    .filter((task): task is WeddingPreparationTask => task !== null);
}
