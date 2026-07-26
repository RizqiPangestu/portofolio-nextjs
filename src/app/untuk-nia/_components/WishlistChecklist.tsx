"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedPerKey } from "@/app/_hooks/useDebouncedPerKey";
import {
  categoryEmoji,
  rowsToWishlistItems,
  WISHLIST_COLUMNS,
  WISHLIST_SHEET,
  type WishlistItem,
} from "../_data/wishlist";
import { useConfig } from "./ConfigProvider";

// Rapid toggles on the same item are coalesced: the UI flips instantly on every
// click, but the network write for an item is deferred until it's been quiet for
// `config.wishlist.toggleDebounceMs`, so only its final state is sent.

// Send an "update" to a single row, matched by its id. Only the provided
// columns are changed, and `updatedDate` is always bumped.
async function updateRow(
  id: string,
  fields: Partial<Record<(typeof WISHLIST_COLUMNS)[number], string>>,
) {
  const entries = { ...fields, updatedDate: new Date().toISOString() };
  const columnNames = Object.keys(entries);
  const rows = Object.values(entries);
  const res = await fetch("/api/sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sheetName: WISHLIST_SHEET,
      action: "update",
      updateColumn: "id",
      updateValue: id,
      columnNames,
      rows,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan.");
}

type FormState = {
  open: boolean;
  editingId: string | null;
  category: string;
  value: string;
};

const EMPTY_FORM: FormState = {
  open: false,
  editingId: null,
  category: "",
  value: "",
};

export default function WishlistChecklist() {
  const { config, ready } = useConfig();
  const loadedRef = useRef(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // For optimistic UI: track the last confirmed value (for rollback) and which items have a request running.
  const toggleBaseline = useRef<Map<string, boolean>>(new Map());
  const toggleInFlight = useRef<Set<string>>(new Set());

  // Coalesces rapid toggles per item and sends only the final state.
  const toggleSync = useDebouncedPerKey<boolean>(async (id, target, ctx) => {
    toggleInFlight.current.add(id);
    let failed = false;
    try {
      await updateRow(id, { isChecked: target ? "TRUE" : "FALSE" });
    } catch (e) {
      failed = true;
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      toggleInFlight.current.delete(id);
    }

    // A newer burst was scheduled while this request was in flight → let that
    // flush be the source of truth; don't finalize or roll back now.
    if (ctx.superseded) return;

    if (failed) {
      const confirmed = toggleBaseline.current.get(id) ?? false;
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isChecked: confirmed } : i)),
      );
    }
    toggleBaseline.current.delete(id);
  }, config.wishlist.toggleDebounceMs);

  async function load(defaultCategory = config.wishlist.defaultCategory) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sheetName: WISHLIST_SHEET });
      const res = await fetch(`/api/sheet?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memuat wishlist.");
      const columnNames: string[] = Array.isArray(json.columnNames)
        ? json.columnNames
        : [];
      const rows: string[][] = Array.isArray(json.rows) ? json.rows : [];
      setItems(rowsToWishlistItems(columnNames, rows, defaultCategory));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat wishlist.");
    } finally {
      setLoading(false);
    }
  }

  // Config comes from the shared provider (fetched once per session). Once it's
  // resolved, load the wishlist using the config-driven default category.
  useEffect(() => {
    if (!ready || loadedRef.current) return;
    loadedRef.current = true;
    void load(config.wishlist.defaultCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const totalDone = items.filter((i) => i.isChecked).length;
  const totalItems = items.length;

  const categoryOptions = useMemo(
    () =>
      Object.keys(config.wishlist.categoryEmoji).map((key) => ({
        value: key,
        label: `${categoryEmoji(key, config.wishlist.categoryEmoji)} ${
          key.charAt(0).toUpperCase() + key.slice(1)
        }`,
      })),
    [config.wishlist.categoryEmoji],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, WishlistItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    // Most-populated categories first; ties fall back to alphabetical order.
    return Array.from(map.entries()).sort(([aName, aItems], [bName, bItems]) => {
      if (bItems.length !== aItems.length) return bItems.length - aItems.length;
      return aName.localeCompare(bName);
    });
  }, [items]);

  function toggleCheck(item: WishlistItem) {
    const id = item.id;

    // Start of a new burst → remember the last confirmed value so we can roll
    // back to it if the eventual save fails. While a flush is pending or a
    // request is in flight, the displayed value is unconfirmed, so we keep the
    // earlier baseline.
    const active = toggleSync.isPending(id) || toggleInFlight.current.has(id);
    if (!active) toggleBaseline.current.set(id, item.isChecked);

    // Flip from the latest intended value, not the (possibly stale) prop.
    const current = toggleSync.peek(id) ?? item.isChecked;
    const nextChecked = !current;

    // Optimistic UI — instant, every click.
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isChecked: nextChecked } : i)),
    );

    // Debounce the write; only the final value is sent.
    toggleSync.schedule(id, nextChecked);
  }

  function openAdd() {
    setFormError(null);
    setForm({ open: true, editingId: null, category: "", value: "" });
  }

  async function deleteItem(item: WishlistItem) {
    const id = item.id;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await updateRow(id, { isArchived: "TRUE" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus.");
      setItems((prev) => (prev.some((i) => i.id === id) ? prev : [...prev, item]));
    }
  }

  function openEdit(item: WishlistItem) {
    setFormError(null);
    setForm({
      open: true,
      editingId: item.id,
      category: item.category,
      value: item.value,
    });
  }

  function closeForm() {
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const category = form.category.trim();
    const value = form.value.trim();
    if (!category || !value) {
      setFormError("Kategori dan wishlist-nya wajib diisi ya ♥");
      return;
    }
    setSaving(true);
    setFormError(null);
    const now = new Date().toISOString();
    try {
      if (form.editingId) {
        const editingId = form.editingId;
        await updateRow(editingId, { category, value });
        // Update local state instead of reloading the whole sheet.
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingId ? { ...i, category, value, updatedDate: now } : i,
          ),
        );
      } else {
        const id = crypto.randomUUID();
        const res = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheetName: WISHLIST_SHEET,
            action: "create",
            columnNames: WISHLIST_COLUMNS,
            rows: [id, category, value, "FALSE", "FALSE", now, now],
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan.");
        // Append the new row locally instead of reloading the whole sheet.
        setItems((prev) => [
          ...prev,
          {
            id,
            category,
            value,
            isChecked: false,
            createdDate: now,
            updatedDate: now,
          },
        ]);
      }
      closeForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-5">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-light text-pink-50 tracking-wide">
          Wishlist Kita
        </h1>
        <p className="mt-2 text-pink-100/70">
          Daftar kecil tempat dan rencana yang mau kita lewati bareng.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-pink-200/30 text-pink-100">
            <span className="text-pink-300">♥</span>
            <span className="tabular-nums">
              {totalDone} / {totalItems} selesai
            </span>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 active:scale-95 transition"
          >
            <span className="text-lg leading-none">+</span>
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load()}
            className="shrink-0 rounded-full border border-red-200/30 px-3 py-1 hover:bg-white/10 transition"
          >
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex items-end gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="nia-heart-bounce text-2xl"
                style={{ animationDelay: `${i * 0.18}s` }}
                aria-hidden
              >
                💗
              </span>
            ))}
          </div>
          <p className="nia-loading-text text-center text-base font-medium tracking-wide">
            Memuat wishlist…
          </p>
        </div>
      ) : totalItems === 0 && !error ? (
        <div className="text-center text-pink-100/70 py-10">
          <p>Belum ada wishlist. Yuk tambahin satu ♥</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full">
          {grouped.map(([category, catItems]) => {
            const itemCols = 3;
            return (
              <section
                key={category}
                className="w-full sm:w-fit sm:max-w-full grow-0 rounded-3xl border border-pink-200/25 bg-white/5 backdrop-blur-md p-5 md:p-6 shadow-[0_10px_40px_-20px_rgba(255,182,193,0.6)]"
              >
                <h2 className="flex items-center gap-2 text-xl md:text-2xl text-pink-50 font-semibold mb-4">
                  <span>
                    {categoryEmoji(category, config.wishlist.categoryEmoji)}
                  </span>
                  <span>{category}</span>
                </h2>
                <ul
                  className="flex flex-wrap gap-2"
                  style={{
                    // Cap the row width to `itemCols` columns (~14rem each +
                    // 0.5rem gaps) so items wrap into that many columns.
                    maxWidth: `calc(${itemCols} * 14rem + ${itemCols - 1} * 0.5rem)`,
                  }}
                >
                {catItems.map((item) => {
                  const isChecked = item.isChecked;
                  return (
                    <li key={item.id} className="grow basis-[14rem]">
                      <div
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition ${
                          isChecked
                            ? "border-pink-300/50 bg-pink-300/10"
                            : "border-pink-200/15 bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCheck(item)}
                          aria-pressed={isChecked}
                          aria-label={
                            isChecked
                              ? `Tandai belum: ${item.value}`
                              : `Tandai selesai: ${item.value}`
                          }
                          className={`relative w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition ${
                            isChecked
                              ? "bg-gradient-to-br from-pink-400 to-rose-400 border-transparent"
                              : "border-pink-200/40 hover:border-pink-200/70"
                          }`}
                        >
                          {isChecked && (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span
                          title={item.value}
                          className={`flex-1 min-w-0 truncate text-pink-50 transition ${
                            isChecked ? "line-through opacity-60" : ""
                          }`}
                        >
                          {item.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`Edit: ${item.value}`}
                          className="shrink-0 rounded-full px-2 py-1 text-xs text-pink-100/70 border border-pink-200/20 hover:bg-white/10 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item)}
                          aria-label={`Hapus: ${item.value}`}
                          title="Hapus"
                          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-red-200/80 border border-red-300/25 hover:bg-red-500/15 hover:text-red-100 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {form.open && (
        <WishlistForm
          form={form}
          categoryOptions={categoryOptions}
          saving={saving}
          error={formError}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={submitForm}
        />
      )}
    </div>
  );
}

function WishlistForm({
  form,
  categoryOptions,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  form: FormState;
  categoryOptions: { value: string; label: string }[];
  saving: boolean;
  error: string | null;
  onChange: (next: FormState) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  // When editing an item whose stored category isn't in the predefined list,
  // keep it selectable so the current value isn't silently dropped.
  const showCurrent =
    !!form.category &&
    !categoryOptions.some((o) => o.value === form.category);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={form.editingId ? "Edit wishlist" : "Tambah wishlist"}
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/70 backdrop-blur-md nia-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-pink-900/80 to-rose-950/80 border border-pink-300/20 shadow-2xl shadow-pink-500/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-pink-300/10 bg-gradient-to-r from-pink-500/10 to-rose-500/10">
          <h2 className="text-lg md:text-xl font-semibold text-pink-50">
            {form.editingId ? "Edit Wishlist" : "Tambah Wishlist"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex items-center justify-center w-9 h-9 rounded-full text-pink-100 hover:bg-white/10 transition"
          >
            <img
              src="/untuk-nia/icons/close.svg"
              alt=""
              aria-hidden="true"
              className="w-5 h-5"
            />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5 md:p-6">
          <label className="flex flex-col gap-2">
            <span className="text-xs md:text-sm text-pink-200/80 font-medium">
              Kategori
            </span>
            <select
              value={form.category}
              onChange={(e) => onChange({ ...form, category: e.target.value })}
              className="w-full p-3 rounded-xl border border-pink-200/25 bg-white/5 text-pink-50 focus:outline-none focus:border-pink-300/60 focus:bg-white/10 transition"
              required
            >
              <option value="" disabled className="bg-rose-950 text-pink-50">
                Pilih kategori…
              </option>
              {showCurrent && (
                <option
                  value={form.category}
                  className="bg-rose-950 text-pink-50"
                >
                  {form.category}
                </option>
              )}
              {categoryOptions.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  className="bg-rose-950 text-pink-50"
                >
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs md:text-sm text-pink-200/80 font-medium">
              Wishlist
            </span>
            <input
              value={form.value}
              onChange={(e) => onChange({ ...form, value: e.target.value })}
              placeholder="mau ngapain / makan apa…"
              className="w-full p-3 rounded-xl border border-pink-200/25 bg-white/5 text-pink-50 placeholder:text-pink-200/40 focus:outline-none focus:border-pink-300/60 focus:bg-white/10 transition"
              required
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full font-medium text-pink-50 bg-white/10 border border-pink-200/25 hover:bg-white/15 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 hover:from-pink-300 hover:to-rose-400 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Menyimpan…" : form.editingId ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
