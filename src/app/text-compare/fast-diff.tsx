import diff from "fast-diff";
import type { ReactNode } from "react";

function highlightDiff(
    original: string,
    modified: string,
    highlightClass: string,
): ReactNode {
    const result = diff(original, modified);
    return (
        <span className="whitespace-pre">
            {result.map(([type, text], idx) => {
                if (type === 0) return <span key={idx}>{text}</span>;
                if (type === -1) {
                    return (
                        <span key={idx} className={`whitespace-pre ${highlightClass}`}>
                            {text}
                        </span>
                    );
                }
                return null;
            })}
        </span>
    );
}

export function renderDiffLine(
    line1: string,
    line2: string,
    highlightClass = "bg-red-700",
) {
    return highlightDiff(line1, line2, highlightClass);
}
