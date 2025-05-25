import { renderDiffLine } from "./fast-diff";
import { Result } from "./text-compare";

type DiffLine = {
    lineNumber: number
    text: string
};

type PlainTextProps = {
    text1:string
    text2:string
}

export default function PlainTextCompare({text1,text2}:PlainTextProps):Result {
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);

    const firstTextDiff: DiffLine[] = [];
    const secondTexDiff: DiffLine[] = [];

    for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || "";
        const line2 = lines2[i] || "";
        if (line1 !== line2){
            firstTextDiff.push({lineNumber:i+1,text:line1});
            secondTexDiff.push({lineNumber:i+1,text:line2});
        }
    }

    const digitCount = String(maxLines).length;
    const numberCompWidth = digitCount * 5;

    return {
        component: <>
            <div className="w-1/2 border-1 overflow-x-auto whitespace-nowrap">
                {firstTextDiff.map((line,i) => (
                    <div key={i}>
                        <span className={`bg-gray-600 inline-block text-center w-${numberCompWidth}`}>
                            {line.lineNumber}
                        </span>
                        <span> </span>
                        <span>
                            {renderDiffLine(line.text, secondTexDiff[i]?.text || "")}
                        </span>
                    </div>
                ))}
            </div>
        
            <div className="border-1 w-1/2 overflow-x-auto whitespace-nowrap">
                {secondTexDiff.map((line,i) => (
                    <div key={i}>
                   <span className={`bg-gray-600 inline-block text-center w-${numberCompWidth}`}>
                            {line.lineNumber}
                        </span>
                    <span>
                        {renderDiffLine(line.text,firstTextDiff[i]?.text || "")}
                    </span>
                </div>
                ))}
            </div>
        </>,
        isSame: text1 === text2
    }
}