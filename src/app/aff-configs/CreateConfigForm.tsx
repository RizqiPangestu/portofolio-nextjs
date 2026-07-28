"use client";

import { useState } from "react";
import { CreateConfigPayload, ValueType, VALUE_TYPES } from "./types";

interface CreateConfigFormProps {
  submitting: boolean;
  onSubmit: (payload: Omit<CreateConfigPayload, "lastVersion">) => Promise<boolean>;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-black/45 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500";

function valuePlaceholder(valueType: ValueType): string {
  switch (valueType) {
    case "number":
      return "42  or  3.14";
    case "boolean":
      return "true / false";
    case "json":
      return '{"foo":"bar"}  or  [1,2,3]';
    default:
      return "some value";
  }
}

export default function CreateConfigForm({
  submitting,
  onSubmit,
}: CreateConfigFormProps) {
  const [key, setKey] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [valueType, setValueType] = useState<ValueType>("string");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = () => {
    setKey("");
    setGroupKey("");
    setValueType("string");
    setValue("");
    setDescription("");
    setEnabled(true);
    setLocalError(null);
  };

  const validateValue = (): string | null => {
    const raw = value.trim();
    if (valueType === "number") {
      if (!/^-?\d+(\.\d+)?$/.test(raw)) return "Value must be a number.";
    } else if (valueType === "boolean") {
      if (!/^(true|false)$/i.test(raw))
        return "Value must be either 'true' or 'false'.";
    } else if (valueType === "json" && raw !== "") {
      try {
        JSON.parse(raw);
      } catch {
        return "Value must be valid JSON.";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!key.trim() || !groupKey.trim()) {
      setLocalError("Key and Group Key are required.");
      return;
    }
    const valueError = validateValue();
    if (valueError) {
      setLocalError(valueError);
      return;
    }
    const ok = await onSubmit({
      key: key.trim(),
      groupKey: groupKey.trim(),
      valueType,
      value: value.trim(),
      description: description.trim(),
      enabled,
    });
    if (ok) reset();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cfg-key" className={labelClass}>
            Key <span className="text-red-400">*</span>
          </label>
          <input
            id="cfg-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="feature.some_flag"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="cfg-group" className={labelClass}>
            Group Key <span className="text-red-400">*</span>
          </label>
          <input
            id="cfg-group"
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value)}
            placeholder="payment"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cfg-valuetype" className={labelClass}>
            Value Type
          </label>
          <select
            id="cfg-valuetype"
            value={valueType}
            onChange={(e) => setValueType(e.target.value as ValueType)}
            className={`${inputClass} appearance-none`}
          >
            {VALUE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cfg-value" className={labelClass}>
            Value
          </label>
          {valueType === "boolean" ? (
            <select
              id="cfg-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="" className="bg-zinc-900">
                Select…
              </option>
              <option value="true" className="bg-zinc-900">
                true
              </option>
              <option value="false" className="bg-zinc-900">
                false
              </option>
            </select>
          ) : (
            <input
              id="cfg-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode={valueType === "number" ? "decimal" : "text"}
              placeholder={valuePlaceholder(valueType)}
              className={inputClass}
            />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="cfg-desc" className={labelClass}>
          Description
        </label>
        <textarea
          id="cfg-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this config for?"
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/40 accent-violet-500"
        />
        Enabled
      </label>

      {localError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 text-sm text-red-200"
        >
          {localError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? "Creating…" : "Create config"}
      </button>
    </form>
  );
}
