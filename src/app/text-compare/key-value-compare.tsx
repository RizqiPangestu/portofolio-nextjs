"use client";

import { renderDiffLine } from './fast-diff';
import { Result } from './text-compare';

type KeyValueMap = Record<string, string>;

export type KeyValueCompareResult = {
    onlyInLeft: Record<string, string>;
    onlyInRight: Record<string, string>;
    differentValues: Array<{ key: string; left: string; right: string }>;
  };

function parseKeyValueText(text: string,delimiter:string, ignoredPrefix: string): KeyValueMap {
    let lines = text.split("\n")
    const map: KeyValueMap = {};
    if (ignoredPrefix !== ""){
        lines = lines.filter(function(line){
            return !line.startsWith(ignoredPrefix)
        });
    }
    for (const line of lines) {
      if (line === ""){
        continue
      }
      if (!line.includes(delimiter)) {
        alert(`Line "${line}" does not contain the delimiter "${delimiter}"`);
        throw new Error(`Line "${line}" does not contain the delimiter "${delimiter}"`);
      }
      const [key, ...rest] = line.split(delimiter);
      if (key && rest.length) {
          map[key.trim()] = rest.join(delimiter).trim();
      }
    }


    return map;
  }

  function compareKeyValueMaps(map1: KeyValueMap, map2: KeyValueMap): KeyValueCompareResult{
    const keys1 = new Set(Object.keys(map1));
    const keys2 = new Set(Object.keys(map2));
    const allKeys = new Set([...keys1, ...keys2]);
  
    const onlyInLeft: KeyValueMap = {};
    const onlyInRight: KeyValueMap = {};
    const differentValues: Array<{ key: string; left: string; right: string }> = [];

    for (const key of allKeys) {
        if (keys1.has(key) && !keys2.has(key)) {
          onlyInLeft[key] = map1[key];
        } else if (!keys1.has(key) && keys2.has(key)) {
          onlyInRight[key] = map2[key];
        } else if (map1[key] !== map2[key]) {
          differentValues.push({
            key,
            left: map1[key],
            right: map2[key],
          });
        }
      }
    
      return { onlyInLeft, onlyInRight, differentValues };
}

type KeyValueProps = {
    text1: string
    text2: string
    delimiter: string
    ignoredPrefix: string
}

export function KeyValueCompare({text1,text2,delimiter,ignoredPrefix}:KeyValueProps):Result{
  const map1 = parseKeyValueText(text1,delimiter,ignoredPrefix);
  const map2 = parseKeyValueText(text2,delimiter,ignoredPrefix);
  const result = compareKeyValueMaps(map1, map2)

  return {
    component: <>
      <div className="w-1/2 border-1 overflow-x-auto whitespace-nowrap">
          {result.differentValues.map(({ key, left, right }) => (
              <div key={key} className="mb-1">
                  <span className="">{key}</span>=
                  <span className="">{renderDiffLine(left, right)}</span>
              </div>
          ))}
          {Object.entries(result.onlyInLeft).map(([key, value]) => (
              <div key={key} className="mb-1">
                  <span className="text-blue-300">{key}</span>=<span className="text-blue-500">{value}</span>
              </div>
          ))}
      </div>

      <div className="w-1/2 border-1 overflow-x-auto whitespace-nowrap">
          {result.differentValues.map(({ key, left, right }) => (
              <div key={key} className="mb-1">
                  <span className="">{key}</span>=
                  <span className="">{renderDiffLine(right,left)}</span>
              </div>
          ))}
          {Object.entries(result.onlyInRight).map(([key, value]) => (
              <div key={key} className="mb-1">
              <span className="text-blue-300">{key}</span>=<span className="text-blue-500">{value}</span>
              </div>
          ))}
      </div>
    </>,
    isSame: result.differentValues.length === 0 &&
      Object.keys(result.onlyInLeft).length === 0 &&
      Object.keys(result.onlyInRight).length === 0
  }
}