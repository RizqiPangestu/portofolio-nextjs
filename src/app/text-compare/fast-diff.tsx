import diff from "fast-diff";

function highlightDiff(original: string, modified: string): React.ReactNode {
    const result = diff(original, modified);
    return (
        <span>
        {result.map(([type, text], idx) => {
            if (type === 0) return <span key={idx}>{text}</span>;
            // if (type === 1) return <span key={idx} className="bg-green-200">{text}</span>;
            if (type === -1) return <span key={idx} className="bg-red-700">{text}</span>;
            return null;
        })}
        </span>
    );
}

// For partial diff, we need to compare each line pair
// and render the diff for each line
export function renderDiffLine(line1: string, line2: string){
    return highlightDiff(line1, line2);
};