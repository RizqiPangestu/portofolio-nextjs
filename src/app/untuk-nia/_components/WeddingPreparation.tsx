"use client";

import { useCallback, useEffect, useState } from "react";
import {
  rowsToWeddingPreparationTasks,
  WEDDING_DATE,
  WEDDING_PREPARATION_COLUMNS,
  WEDDING_PREPARATION_SHEET,
  type WeddingPreparationTask,
} from "../_data/weddingPreparation";

const WEDDING_TIME = new Date(WEDDING_DATE).getTime();

function pad(value: number) {
  return String(value).padStart(2, "0");
}

async function updateTask(
  id: string,
  fields: Partial<Record<(typeof WEDDING_PREPARATION_COLUMNS)[number], string>>,
) {
  const entries = { ...fields, updatedDate: new Date().toISOString() };
  const response = await fetch("/api/sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sheetName: WEDDING_PREPARATION_SHEET,
      action: "update",
      updateColumn: "id",
      updateValue: id,
      columnNames: Object.keys(entries),
      rows: Object.values(entries),
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Gagal menyimpan checklist.");
}

export default function WeddingPreparation() {
  const [now, setNow] = useState<number | null>(null);
  const [tasks, setTasks] = useState<WeddingPreparationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftDeadlineDate, setDraftDeadlineDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sheetName: WEDDING_PREPARATION_SHEET,
      });
      const response = await fetch(`/api/sheet?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Gagal memuat checklist.");

      const columnNames: string[] = Array.isArray(json.columnNames)
        ? json.columnNames
        : [];
      const rows: string[][] = Array.isArray(json.rows) ? json.rows : [];
      setTasks(rowsToWeddingPreparationTasks(columnNames, rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat checklist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const remainingSeconds =
    now === null ? 0 : Math.max(0, Math.ceil((WEDDING_TIME - now) / 1000));
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const completedCount = tasks.filter((task) => task.isChecked).length;

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || !draftDeadlineDate) {
      setError("Isi nama persiapan dan pilih tanggal deadline.");
      return;
    }

    setSaving(true);
    setError(null);
    const nowIso = new Date().toISOString();
    try {
      if (editingId) {
        await updateTask(editingId, { value, deadlineDate: draftDeadlineDate });
        setTasks((current) =>
          current.map((task) =>
            task.id === editingId
              ? { ...task, value, deadlineDate: draftDeadlineDate, updatedDate: nowIso }
              : task,
          ),
        );
      } else {
        const id = crypto.randomUUID();
        const response = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheetName: WEDDING_PREPARATION_SHEET,
            action: "create",
            columnNames: WEDDING_PREPARATION_COLUMNS,
            rows: [
              id,
              value,
              draftDeadlineDate,
              "FALSE",
              "FALSE",
              nowIso,
              nowIso,
            ],
          }),
        });
        const json = await response.json();
        if (!response.ok)
          throw new Error(json.error ?? "Gagal menambahkan checklist.");
        setTasks((current) => [
          ...current,
          {
            id,
            value,
            deadlineDate: draftDeadlineDate,
            isChecked: false,
            createdDate: nowIso,
            updatedDate: nowIso,
          },
        ]);
      }

      setDraft("");
      setDraftDeadlineDate("");
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: WeddingPreparationTask) {
    if (busyIds.has(task.id)) return;
    setBusyIds((current) => new Set(current).add(task.id));
    setError(null);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, isChecked: !task.isChecked } : item,
      ),
    );
    try {
      await updateTask(task.id, {
        isChecked: task.isChecked ? "FALSE" : "TRUE",
      });
    } catch (e) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, isChecked: task.isChecked } : item,
        ),
      );
      setError(e instanceof Error ? e.message : "Gagal menyimpan checklist.");
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  }

  async function archiveTask(task: WeddingPreparationTask) {
    if (busyIds.has(task.id)) return;
    setBusyIds((current) => new Set(current).add(task.id));
    setError(null);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    try {
      await updateTask(task.id, { isArchived: "TRUE" });
      if (editingId === task.id) {
        setEditingId(null);
        setDraft("");
        setDraftDeadlineDate("");
      }
    } catch (e) {
      setTasks((current) => [...current, task]);
      setError(e instanceof Error ? e.message : "Gagal menghapus checklist.");
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  }

  function startEditing(task: WeddingPreparationTask) {
    setEditingId(task.id);
    setDraft(task.value);
    setDraftDeadlineDate(task.deadlineDate);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft("");
    setDraftDeadlineDate("");
  }

  return (
    <section className="w-full px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-pink-200/70">
            Satu langkah menuju hari kita
          </p>
          <h1 className="mt-3 text-3xl font-light tracking-wide text-pink-50 md:text-5xl">
            Wedding Preparation
          </h1>
          <p className="mt-3 text-pink-100/70">
            28 Agustus 2027 · 00.00 WIB
          </p>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-pink-200/20 bg-white/5 px-4 py-8 shadow-[0_10px_40px_-20px_rgba(255,182,193,0.6)] backdrop-blur-md md:px-8 md:py-10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,105,180,0.16)_0%,transparent_70%)]"
            aria-hidden="true"
          />
          <p className="relative text-center text-pink-100/80">
            {remainingSeconds > 0 ? "Menuju hari pernikahan" : "Hari bahagia kita"}
          </p>
          <div
            className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
            aria-live="polite"
            aria-label={`${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`}
          >
            {[
              { label: "Hari", value: String(days).padStart(2, "0") },
              { label: "Jam", value: pad(hours) },
              { label: "Menit", value: pad(minutes) },
              { label: "Detik", value: pad(seconds) },
            ].map((unit) => (
              <div
                key={unit.label}
                className="flex flex-col items-center rounded-2xl border border-pink-200/10 bg-black/10 px-3 py-4"
              >
                <span className="text-4xl font-light tabular-nums text-white drop-shadow-[0_0_14px_rgba(255,182,193,0.45)] md:text-5xl">
                  {unit.value}
                </span>
                <span className="mt-2 text-xs uppercase tracking-[0.2em] text-pink-200/70">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-light text-pink-50 md:text-3xl">
                Checklist Persiapan
              </h2>
              <p className="mt-1 text-sm text-pink-100/65">
                {completedCount} dari {tasks.length} persiapan selesai
              </p>
            </div>
          </div>

          <form
            onSubmit={submitTask}
            className="flex flex-col gap-3 rounded-2xl border border-pink-200/20 bg-white/5 p-4 sm:flex-row"
          >
            <label className="sr-only" htmlFor="wedding-preparation-task">
              Nama persiapan
            </label>
            <input
              id="wedding-preparation-task"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Contoh: Tentukan venue"
              maxLength={200}
              required
              className="min-w-0 flex-1 rounded-xl border border-pink-200/20 bg-black/15 px-4 py-3 text-pink-50 placeholder:text-pink-100/40 focus:border-pink-300/60 focus:outline-none"
            />
            <label className="flex min-w-0 flex-col gap-1 text-xs text-pink-100/70">
              <span>Tanggal</span>
              <input
                type="date"
                lang="id"
                value={draftDeadlineDate}
                onChange={(event) => setDraftDeadlineDate(event.target.value)}
                required
                className="min-w-0 rounded-xl border border-pink-200/20 bg-black/15 px-3 py-3 text-sm text-pink-50 focus:border-pink-300/60 focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-pink-200/25 px-4 py-2 text-pink-100 hover:bg-white/10"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 px-5 py-2 font-medium text-white shadow-lg shadow-pink-500/20 transition hover:from-pink-300 hover:to-rose-400 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {saving
                  ? "Menyimpan…"
                  : editingId
                    ? "Simpan"
                    : "Tambah persiapan"}
              </button>
            </div>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadTasks()}
                className="rounded-full border border-red-200/30 px-3 py-1 hover:bg-white/10"
              >
                Muat ulang
              </button>
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-pink-100/70">
              Memuat checklist…
            </p>
          ) : tasks.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-pink-200/20 px-4 py-10 text-center text-pink-100/70">
              Belum ada persiapan. Tambahkan hal pertama yang perlu disiapkan ♥
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                    task.isChecked
                      ? "border-pink-300/40 bg-pink-300/10"
                      : "border-pink-200/15 bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void toggleTask(task)}
                    disabled={busyIds.has(task.id)}
                    aria-pressed={task.isChecked}
                    aria-label={
                      task.isChecked
                        ? `Tandai belum selesai: ${task.value}`
                        : `Tandai selesai: ${task.value}`
                    }
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      task.isChecked
                        ? "border-transparent bg-gradient-to-br from-pink-400 to-rose-400"
                        : "border-pink-200/40 hover:border-pink-200/70"
                    }`}
                  >
                    {task.isChecked && (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-hidden="true"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span
                      className={`min-w-0 break-words text-pink-50 ${
                        task.isChecked ? "opacity-60 line-through" : ""
                      }`}
                    >
                      {task.value}
                    </span>
                    {task.deadlineDate && (
                      <time
                        dateTime={task.deadlineDate}
                        className="shrink-0 text-xs text-pink-200/70"
                      >
                        Tanggal:{" "}
                        {new Date(
                          `${task.deadlineDate}T00:00:00Z`,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditing(task)}
                    disabled={busyIds.has(task.id)}
                    aria-label={`Edit: ${task.value}`}
                    className="rounded-full border border-pink-200/20 px-3 py-1 text-xs text-pink-100/80 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void archiveTask(task)}
                    disabled={busyIds.has(task.id)}
                    aria-label={`Hapus: ${task.value}`}
                    className="rounded-full border border-red-300/25 px-3 py-1 text-xs text-red-200/90 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
