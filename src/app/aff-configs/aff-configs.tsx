"use client";

import { useCallback, useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import CreateConfigForm from "./CreateConfigForm";
import {
  ApiResponse,
  ConfigItem,
  CreateConfigPayload,
  DeleteConfigPayload,
} from "./types";

const DEFAULT_URL = "http://localhost:8080";
const PROXY_URL = "/api/aff-configs";

const GET_SUFFIX = "/aff-configs";
const MUTATION_SUFFIX = "/aff-config";

function normalizeBase(base: string): string {
  let b = base.trim();
  b = b.replace(/\/+$/, "");
  b = b.replace(/\/aff-configs$/i, "").replace(/\/aff-config$/i, "");
  b = b.replace(/\/+$/, "");
  return b;
}

function buildUrl(base: string, method: "GET" | "POST" | "DELETE"): string {
  return normalizeBase(base) + (method === "GET" ? GET_SUFFIX : MUTATION_SUFFIX);
}

type Banner = { type: "success" | "error"; text: string } | null;

async function callApi(
  base: string,
  method: "GET" | "POST" | "DELETE",
  cookie: string,
  body?: unknown
): Promise<Response> {
  return fetch(PROXY_URL, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-target-url": buildUrl(base, method),
      "x-proxy-cookie": cookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed with status ${res.status}.`;
    throw new Error(message);
  }
  return data as ApiResponse<T>;
}

export default function AffConfigs() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_URL);
  const [cookie, setCookie] = useState("");
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<ConfigItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<{
    key: string;
    groupKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchConfigs = useCallback(async () => {
    if (!apiUrl.trim()) {
      setBanner({ type: "error", text: "Please provide an API URL first." });
      return;
    }
    if (!cookie.trim()) {
      setBanner({ type: "error", text: "Please provide a cookie first." });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      const res = await callApi(apiUrl.trim(), "GET", cookie.trim());
      const parsed = await parseResponse<ConfigItem[]>(res);
      setConfigs(Array.isArray(parsed.data) ? parsed.data : []);
    } catch (err) {
      setConfigs([]);
      setBanner({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load configs. Is your VPN on and the URL correct?",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, cookie]);

  const handleCreate = async (
    input: Omit<CreateConfigPayload, "lastVersion">
  ): Promise<boolean> => {
    if (!cookie.trim()) {
      setBanner({ type: "error", text: "Please provide a cookie first." });
      return false;
    }
    const existing = configs.find(
      (c) => c.key === input.key && c.groupKey === input.groupKey
    );
    const payload: CreateConfigPayload = {
      ...input,
      lastVersion: existing?.version ?? 0,
    };
    setSubmitting(true);
    setBanner(null);
    try {
      const res = await callApi(apiUrl.trim(), "POST", cookie.trim(), payload);
      await parseResponse<unknown>(res);
      setBanner({
        type: "success",
        text: `Config "${input.key}" saved successfully.`,
      });
      await fetchConfigs();
      return true;
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create config.",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    if (!cookie.trim()) {
      setBanner({ type: "error", text: "Please provide a cookie first." });
      return;
    }
    const payload: DeleteConfigPayload = {
      key: toDelete.key,
      groupKey: toDelete.groupKey,
      lastVersion: toDelete.version,
    };
    setDeleting(true);
    setBanner(null);
    try {
      const res = await callApi(
        apiUrl.trim(),
        "DELETE",
        cookie.trim(),
        payload
      );
      await parseResponse<unknown>(res);
      setBanner({
        type: "success",
        text: `Config "${toDelete.key}" deleted.`,
      });
      setToDelete(null);
      await fetchConfigs();
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete config.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (cfg: ConfigItem) => {
    setEditing({ key: cfg.key, groupKey: cfg.groupKey });
    setEditValue(cfg.value);
    setEditEnabled(cfg.enabled);
    setBanner(null);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (cfg: ConfigItem) => {
    setSavingEdit(true);
    const ok = await handleCreate({
      key: cfg.key,
      groupKey: cfg.groupKey,
      valueType: cfg.valueType,
      value: editValue.trim(),
      description: cfg.description ?? "",
      enabled: editEnabled,
    });
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? configs.filter(
          (c) =>
            c.key.toLowerCase().includes(q) ||
            c.groupKey.toLowerCase().includes(q) ||
            c.value.toLowerCase().includes(q) ||
            (c.description ?? "").toLowerCase().includes(q)
        )
      : configs;
    return [...base].sort(
      (a, b) =>
        a.groupKey.localeCompare(b.groupKey) || a.key.localeCompare(b.key)
    );
  }, [configs, search]);

  const getUrlPreview = useMemo(() => buildUrl(apiUrl, "GET"), [apiUrl]);
  const mutationUrlPreview = useMemo(
    () => buildUrl(apiUrl, "POST"),
    [apiUrl]
  );

  return (
    <div className="min-h-screen bg-[#0f1419] text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Aff Configs Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            View, create and delete configs. Requests are proxied through this
            app&apos;s server (avoiding CORS and mixed-content limits), so make
            sure the machine running it has VPN access to the API.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-xl shadow-black/30 backdrop-blur">
          <label
            htmlFor="api-url"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            API base URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://your-host"
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-black/45 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]"
            />
            <button
              type="button"
              onClick={fetchConfigs}
              disabled={loading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Loading…" : "Load configs"}
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-300/90">
            Enter the base URL only. Do <span className="font-semibold">not</span>{" "}
            add{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 font-mono">
              {GET_SUFFIX}
            </code>{" "}
            or{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 font-mono">
              {MUTATION_SUFFIX}
            </code>
            {" "}— it&apos;s appended automatically per action (any such suffix
            you type will be stripped).
          </p>

          <div className="mt-4">
            <label
              htmlFor="cookie"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Cookie <span className="text-red-400">*</span>
            </label>
            <textarea
              id="cookie"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="name=value; other=value"
              rows={2}
              className="w-full resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-black/45 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]"
              required
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Sent with every request as the{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 font-mono">
                Cookie
              </code>{" "}
              header.
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Full URL preview
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-cyan-300">
                GET
              </span>
              <span className="break-all font-mono text-zinc-300">
                {getUrlPreview}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-violet-300">
                POST / DELETE
              </span>
              <span className="break-all font-mono text-zinc-300">
                {mutationUrlPreview}
              </span>
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Headers preview
            </p>
            <p className="break-all font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">Content-Type:</span>{" "}
              application/json
            </p>
            <p className="break-all font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">Cookie:</span>{" "}
              {cookie.trim() ? (
                cookie.trim()
              ) : (
                <span className="text-amber-300/90">(required — not set)</span>
              )}
            </p>
          </div>
        </section>

        {banner && (
          <p
            role="alert"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              banner.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
                : "border-red-500/30 bg-red-950/50 text-red-200"
            }`}
          >
            {banner.text}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="order-2 rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-xl shadow-black/30 backdrop-blur lg:order-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                Configs{" "}
                <span className="text-sm font-normal text-zinc-500">
                  ({filtered.length})
                </span>
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full max-w-xs rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50"
              />
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-zinc-500">
                Loading configs…
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">
                No configs to show. Load them from your endpoint or create a new
                one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="px-2 py-2 font-medium">Key</th>
                      <th className="px-2 py-2 font-medium">Group</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Value</th>
                      <th className="px-2 py-2 font-medium">Enabled</th>
                      <th className="px-2 py-2 font-medium">Ver</th>
                      <th className="px-2 py-2 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cfg) => {
                      const isRowEditing =
                        editing?.key === cfg.key &&
                        editing?.groupKey === cfg.groupKey;
                      return (
                        <tr
                          key={`${cfg.groupKey}:${cfg.key}`}
                          className="border-b border-white/5 align-top hover:bg-white/[0.02]"
                        >
                          <td className="break-all px-2 py-2.5 font-mono text-zinc-100">
                            {cfg.key}
                          </td>
                          <td className="break-all px-2 py-2.5 text-cyan-300/90">
                            {cfg.groupKey}
                          </td>
                          <td className="px-2 py-2.5 text-[11px] uppercase tracking-wide text-zinc-500">
                            {cfg.valueType}
                          </td>
                          <td className="px-2 py-2.5">
                            {isRowEditing ? (
                              cfg.valueType === "boolean" ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full min-w-[8rem] appearance-none rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-violet-500/50"
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
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  inputMode={
                                    cfg.valueType === "number"
                                      ? "decimal"
                                      : "text"
                                  }
                                  className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-violet-500/50"
                                />
                              )
                            ) : (
                              <span className="break-all font-mono text-emerald-200/90">
                                {cfg.value === "" ? (
                                  <span className="text-zinc-600">(empty)</span>
                                ) : (
                                  cfg.value
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            {isRowEditing ? (
                              <input
                                type="checkbox"
                                checked={editEnabled}
                                onChange={(e) =>
                                  setEditEnabled(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-white/20 bg-black/40 accent-violet-500"
                              />
                            ) : (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                  cfg.enabled
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-zinc-500/15 text-zinc-400"
                                }`}
                              >
                                {cfg.enabled ? "on" : "off"}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-xs text-zinc-500">
                            {cfg.version}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex justify-end gap-2">
                              {isRowEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(cfg)}
                                    disabled={savingEdit}
                                    className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {savingEdit ? "Saving…" : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={savingEdit}
                                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(cfg)}
                                    disabled={editing !== null}
                                    className="rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToDelete(cfg)}
                                    disabled={editing !== null}
                                    className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="order-1 h-fit rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-xl shadow-black/30 backdrop-blur lg:order-2 lg:sticky lg:top-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Add / update config
            </h2>
            <CreateConfigForm submitting={submitting} onSubmit={handleCreate} />
          </section>
        </div>
      </div>

      <ConfirmModal
        open={toDelete !== null}
        loading={deleting}
        title="Delete config?"
        description={
          toDelete ? (
            <>
              You are about to delete{" "}
              <span className="font-mono font-medium text-zinc-200">
                {toDelete.key}
              </span>{" "}
              in group{" "}
              <span className="font-mono font-medium text-zinc-200">
                {toDelete.groupKey}
              </span>{" "}
              (version {toDelete.version}). This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
