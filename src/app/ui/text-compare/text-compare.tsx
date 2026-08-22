"use client";

import { useState, useEffect } from "react";
import { KeyValueCompare } from "../../text-compare/key-value-compare";
import PlainTextCompare from "@/app/text-compare/plain-text-compare";
import { Result } from "@/app/text-compare/text-compare";

type TextBox = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function InputTextBox({ value, onChange }: TextBox) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder="Paste or type text here…"
      className="h-full w-full resize-none overflow-x-auto whitespace-pre bg-transparent p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-0"
    />
  );
}

type Button = {
  onCompare: React.MouseEventHandler<HTMLButtonElement>;
  showResult: boolean;
  compareResult: boolean;
  onClear: React.MouseEventHandler<HTMLButtonElement>;
};

function CompareButton({ onCompare, showResult, onClear }: Button) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        className="w-full rounded-xl bg-teal-800/80 px-4 py-2.5 text-center text-sm font-semibold text-teal-50 transition-colors hover:bg-teal-700/90 active:bg-teal-800"
        onClick={onCompare}
      >
        Compare
      </button>
      {showResult && (
        <button
          className="w-full rounded-lg border border-zinc-600/50 bg-zinc-700/50 px-3 py-1.5 text-center text-xs text-zinc-300 transition-colors hover:bg-zinc-600/60"
          onClick={onClear}
        >
          Clear
        </button>
      )}
    </div>
  );
}

type CompareMode = "plain" | "keyvalue";

type CompareMethodOptionProps = {
  setCompareMode: (value: CompareMode) => void;
  compareMode: CompareMode;
};

function CompareMethodOption({
  setCompareMode,
  compareMode,
}: CompareMethodOptionProps) {
  return (
    <div className="mb-3 flex flex-col items-center gap-2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Compare mode
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-zinc-300">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5">
          <input
            type="radio"
            name="compareMode"
            checked={compareMode === "plain"}
            onChange={() => setCompareMode("plain")}
            className="accent-teal-600"
          />
          Plain Text
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5">
          <input
            type="radio"
            name="compareMode"
            checked={compareMode === "keyvalue"}
            onChange={() => setCompareMode("keyvalue")}
            className="accent-teal-600"
          />
          Key-Value
        </label>
      </div>
    </div>
  );
}

function Card() {
  const [firstText, setFirstText] = useState<string>("");
  const handleFirstTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFirstText(e.target.value);
  };

  const [secondText, setSecondText] = useState<string>("");
  const handleSecondTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSecondText(e.target.value);
  };

  const [compareResult, setCompareResult] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [diffComponent, setDiffComponent] = useState<React.ReactNode>();
  const [compareMode, setCompareMode] = useState<CompareMode>("plain");
  const [delimiter, setDelimiter] = useState<string>("=");
  const [ignoredPrefix, setIgnoredPrefix] = useState<string>("");

  const handleOnCompare = () => {
    if (compareMode === "keyvalue" && !delimiter.trim()) {
      alert("Delimiter is required!");
      return;
    }

    let result: Result = { component: <></>, isSame: true };
    if (compareMode == "keyvalue") {
      result = KeyValueCompare({
        text1: firstText,
        text2: secondText,
        delimiter: delimiter,
        ignoredPrefix: ignoredPrefix,
      });
    } else {
      result = PlainTextCompare({ text1: firstText, text2: secondText });
    }

    setDiffComponent(result.component);
    setCompareResult(result.isSame);
    setShowDiff(!result.isSame);
    setShowResult(true);
  };

  const handleOnClear = () => {
    setFirstText("");
    setSecondText("");
    setShowResult(false);
    setShowDiff(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (showResult && compareResult) {
      const timer = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [showResult, compareResult]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-6xl flex-row items-stretch justify-center gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Left
          </div>
          <div className="h-[400px] overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-800/80 shadow-lg shadow-black/25">
            <InputTextBox value={firstText} onChange={handleFirstTextChange} />
          </div>
        </div>

        <div className="flex w-40 shrink-0 flex-col items-center justify-center rounded-2xl border border-zinc-700/70 bg-zinc-800/60 px-3 py-4">
          <CompareMethodOption
            setCompareMode={setCompareMode}
            compareMode={compareMode}
          />
          {compareMode === "keyvalue" && (
            <div className="mb-4 flex w-full flex-col gap-2">
              <label className="flex items-center justify-between overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-900/70 text-xs text-zinc-400">
                <span className="px-2 py-1">Delimiter</span>
                <input
                  type="text"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="h-7 w-8 bg-transparent text-center text-zinc-200 outline-none"
                />
              </label>
              <label className="flex items-center justify-between overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-900/70 text-xs text-zinc-400">
                <span className="px-2 py-1">Ignored</span>
                <input
                  type="text"
                  value={ignoredPrefix}
                  onChange={(e) => setIgnoredPrefix(e.target.value)}
                  className="h-7 w-8 bg-transparent text-center text-zinc-200 outline-none"
                />
              </label>
            </div>
          )}
          <CompareButton
            onCompare={handleOnCompare}
            showResult={showResult}
            compareResult={compareResult}
            onClear={handleOnClear}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Right
          </div>
          <div className="h-[400px] overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-800/80 shadow-lg shadow-black/25">
            <InputTextBox value={secondText} onChange={handleSecondTextChange} />
          </div>
        </div>
      </div>

      {showResult && compareResult && (
        <div
          className={`rounded-xl border border-emerald-500/20 bg-emerald-500/35 px-8 py-2 text-sm text-emerald-200 transition-all duration-1000 ${
            mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
        >
          Texts are the same
        </div>
      )}

      {showDiff && (
        <div className="flex w-full max-w-6xl flex-col items-center gap-3">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/35 px-8 py-2 text-sm text-rose-100">
            Texts are different
          </div>
          <div className="flex w-full flex-row justify-center gap-5 overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-800/50 p-3">
            {diffComponent}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TextCompare() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900 text-zinc-200">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      >
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-zinc-600/25 blur-[110px]" />
        <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-teal-800/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-800/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col px-6 py-10">
        <header className="mb-8 text-center">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-200">
            Text Compare
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Compare two snippets side by side
          </p>
        </header>
        <Card />
      </div>
    </div>
  );
}
