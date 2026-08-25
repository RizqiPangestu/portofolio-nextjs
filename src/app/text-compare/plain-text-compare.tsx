import type { ReactNode } from "react";
import { renderDiffLine } from "./fast-diff";
import { Result } from "./text-compare";

type PlainTextProps = {
    text1: string;
    text2: string;
};

type LineOp =
    | { kind: "equal"; left: string; right: string; leftNo: number; rightNo: number }
    | { kind: "delete"; left: string; leftNo: number }
    | { kind: "insert"; right: string; rightNo: number };

type AlignRow =
    | { type: "equal"; left: string; right: string; leftNo: number; rightNo: number }
    | { type: "change"; left: string; right: string; leftNo: number; rightNo: number }
    | { type: "delete"; left: string; leftNo: number }
    | { type: "insert"; right: string; rightNo: number };

function splitLines(text: string): string[] {
    return text.split(/\r?\n/);
}

function diffLineOps(left: string[], right: string[]): LineOp[] {
    const n = left.length;
    const m = right.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] =
                left[i] === right[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const ops: LineOp[] = [];
    let i = 0;
    let j = 0;
    let leftNo = 1;
    let rightNo = 1;
    while (i < n && j < m) {
        if (left[i] === right[j]) {
            ops.push({
                kind: "equal",
                left: left[i],
                right: right[j],
                leftNo: leftNo++,
                rightNo: rightNo++,
            });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            ops.push({ kind: "delete", left: left[i], leftNo: leftNo++ });
            i++;
        } else {
            ops.push({ kind: "insert", right: right[j], rightNo: rightNo++ });
            j++;
        }
    }
    while (i < n) {
        ops.push({ kind: "delete", left: left[i++], leftNo: leftNo++ });
    }
    while (j < m) {
        ops.push({ kind: "insert", right: right[j++], rightNo: rightNo++ });
    }
    return ops;
}

function alignRows(ops: LineOp[]): AlignRow[] {
    const rows: AlignRow[] = [];
    let k = 0;
    while (k < ops.length) {
        const op = ops[k];
        if (op.kind === "equal") {
            rows.push({
                type: "equal",
                left: op.left,
                right: op.right,
                leftNo: op.leftNo,
                rightNo: op.rightNo,
            });
            k++;
            continue;
        }

        const deletes: Extract<LineOp, { kind: "delete" }>[] = [];
        const inserts: Extract<LineOp, { kind: "insert" }>[] = [];
        while (k < ops.length && ops[k].kind !== "equal") {
            const hunk = ops[k];
            if (hunk.kind === "delete") deletes.push(hunk);
            else if (hunk.kind === "insert") inserts.push(hunk);
            k++;
        }

        const paired = Math.min(deletes.length, inserts.length);
        for (let p = 0; p < paired; p++) {
            rows.push({
                type: "change",
                left: deletes[p].left,
                right: inserts[p].right,
                leftNo: deletes[p].leftNo,
                rightNo: inserts[p].rightNo,
            });
        }
        for (let p = paired; p < deletes.length; p++) {
            rows.push({
                type: "delete",
                left: deletes[p].left,
                leftNo: deletes[p].leftNo,
            });
        }
        for (let p = paired; p < inserts.length; p++) {
            rows.push({
                type: "insert",
                right: inserts[p].right,
                rightNo: inserts[p].rightNo,
            });
        }
    }
    return rows;
}

const GAP_BG =
    "bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(255,255,255,0.06)_5px,rgba(255,255,255,0.06)_10px)]";

function LineRow({
    gutterCh,
    gutter,
    rowClass,
    gutterClass,
    children,
}: {
    gutterCh: number;
    gutter: number | null;
    rowClass: string;
    gutterClass: string;
    children: ReactNode;
}) {
    return (
        <div className={`flex w-max min-w-full ${rowClass}`}>
            <span
                className={`sticky left-0 z-10 shrink-0 select-none px-2 text-right tabular-nums text-zinc-400 ${gutterClass}`}
                style={{ minWidth: `${gutterCh + 2}ch` }}
            >
                {gutter ?? ""}
            </span>
            <span className="whitespace-pre px-2">{children}</span>
        </div>
    );
}

function LeftPane({ rows, gutterCh }: { rows: AlignRow[]; gutterCh: number }) {
    return (
        <div className="w-1/2 overflow-x-auto overflow-y-clip border font-mono text-sm leading-6">
            {rows.map((row, i) => {
                if (row.type === "equal") {
                    return (
                        <LineRow
                            key={i}
                            gutterCh={gutterCh}
                            gutter={row.leftNo}
                            rowClass=""
                            gutterClass="bg-zinc-800"
                        >
                            {row.left}
                        </LineRow>
                    );
                }
                if (row.type === "insert") {
                    return (
                        <LineRow
                            key={i}
                            gutterCh={gutterCh}
                            gutter={null}
                            rowClass={GAP_BG}
                            gutterClass="bg-zinc-900"
                        >
                            {"\u00a0"}
                        </LineRow>
                    );
                }
                const isChange = row.type === "change";
                return (
                    <LineRow
                        key={i}
                        gutterCh={gutterCh}
                        gutter={row.leftNo}
                        rowClass="bg-red-950/55"
                        gutterClass="bg-red-950/80"
                    >
                        {isChange
                            ? renderDiffLine(row.left, row.right, "bg-red-700")
                            : row.left}
                    </LineRow>
                );
            })}
        </div>
    );
}

function RightPane({ rows, gutterCh }: { rows: AlignRow[]; gutterCh: number }) {
    return (
        <div className="w-1/2 overflow-x-auto overflow-y-clip border font-mono text-sm leading-6">
            {rows.map((row, i) => {
                if (row.type === "equal") {
                    return (
                        <LineRow
                            key={i}
                            gutterCh={gutterCh}
                            gutter={row.rightNo}
                            rowClass=""
                            gutterClass="bg-zinc-800"
                        >
                            {row.right}
                        </LineRow>
                    );
                }
                if (row.type === "delete") {
                    return (
                        <LineRow
                            key={i}
                            gutterCh={gutterCh}
                            gutter={null}
                            rowClass={GAP_BG}
                            gutterClass="bg-zinc-900"
                        >
                            {"\u00a0"}
                        </LineRow>
                    );
                }
                const isChange = row.type === "change";
                return (
                    <LineRow
                        key={i}
                        gutterCh={gutterCh}
                        gutter={row.rightNo}
                        rowClass="bg-green-950/55"
                        gutterClass="bg-green-950/80"
                    >
                        {isChange
                            ? renderDiffLine(row.right, row.left, "bg-green-700")
                            : row.right}
                    </LineRow>
                );
            })}
        </div>
    );
}

export default function PlainTextCompare({ text1, text2 }: PlainTextProps): Result {
    const left = splitLines(text1);
    const right = splitLines(text2);
    const rows = alignRows(diffLineOps(left, right));
    const gutterCh = String(Math.max(left.length, right.length, 1)).length;

    return {
        component: (
            <>
                <LeftPane rows={rows} gutterCh={gutterCh} />
                <RightPane rows={rows} gutterCh={gutterCh} />
            </>
        ),
        isSame: text1 === text2,
    };
}
