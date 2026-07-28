export type ValueType = "string" | "boolean" | "number" | "json";

export const VALUE_TYPES: ValueType[] = [
  "string",
  "boolean",
  "number",
  "json",
];

export interface ConfigItem {
  key: string;
  groupKey: string;
  description: string;
  valueType: string;
  value: string;
  enabled: boolean;
  version: number;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  serverTime: number;
}

export interface CreateConfigPayload {
  key: string;
  groupKey: string;
  valueType: string;
  value: string;
  description: string;
  enabled: boolean;
  lastVersion: number;
}

export interface DeleteConfigPayload {
  key: string;
  groupKey: string;
  lastVersion: number;
}
