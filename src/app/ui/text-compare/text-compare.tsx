"use client";

import { useState, useEffect } from 'react';
import { KeyValueCompare } from '../../text-compare/key-value-compare';
import PlainTextCompare from '@/app/text-compare/plain-text-compare';
import { Result } from '@/app/text-compare/text-compare';

type TextBox = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function InputTextBox({
    value,
    onChange
  }:TextBox){
    return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder="Type here..."
          className={`w-full h-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-x-auto whitespace-nowrap`}
        />
      );
}

type Button = {
    onCompare: (React.MouseEventHandler<HTMLButtonElement>)
    showResult: boolean
    compareResult: boolean
    onClear: (React.MouseEventHandler<HTMLButtonElement>)
}

function CompareButton({onCompare,showResult,compareResult,onClear}:Button){
    return <div className='flex flex-col min-h-[100px] min-w-[100px] gap-5 items-center'>
        <button className="border-1 w-full text-center bg-green-700 hover:bg-green-900 active:bg-green-700 transition-colors font-bold py-2 px-4 rounded" onClick={onCompare}>
            Compare
        </button>
        <div className='flex flex-col items-center w-full'>
            {showResult && (
                <button className='border-1 w-1/2 text-center py-1 text-sm bg-green-700 hover:bg-green-900 active:bg-green-700 transition-colors rounded' onClick={onClear}>
                    clear
                </button>
            )}
        </div>
    </div>
}

type CompareMode = 'plain' | 'keyvalue';

type CompareMethodOptionProps = {
    setCompareMode: (value: CompareMode) => void;
    compareMode: CompareMode
}

function CompareMethodOption({setCompareMode,compareMode}:CompareMethodOptionProps){
    return <div className="flex flex-col justify-center items-center gap-2 mb-2">
        <div className=''>
            Compare Mode
        </div>
        <div className="flex flex-col">
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name="compareMode"
                    checked={compareMode === 'plain'}
                    onChange={() => setCompareMode('plain')}
                />
                Plain Text
            </label>
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name="compareMode"
                    checked={compareMode === 'keyvalue'}
                    onChange={() => setCompareMode('keyvalue')}
                />
                Key-Value
            </label>
        </div>
    </div>
}

function Card(){
    const [firstText, setFirstText] = useState<string>('');
    const handleFirstTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFirstText(e.target.value);
    };
    
    const [secondText, setSecondText] = useState<string>('');
    const handleSecondTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSecondText(e.target.value);
    };

    const [compareResult,setCompareResult] = useState<boolean>(false);
    const [showResult,setShowResult] = useState<boolean>(false);
    const [showDiff,setShowDiff] = useState<boolean>(false);
    const [diffComponent,setDiffComponent] = useState<React.ReactNode>();
    const [compareMode, setCompareMode] = useState<CompareMode>('plain');
    const [delimiter, setDelimiter] = useState<string>('=');
    const [ignoredPrefix, setIgnoredPrefix] = useState<string>('');

    const handleOnCompare = () => {
        if (compareMode === 'keyvalue' && !delimiter.trim()) {
            alert('Delimiter is required!');
            return;
        }

        let result: Result = {component:<></>,isSame:true}
        if (compareMode == "keyvalue"){
            result = KeyValueCompare({text1:firstText,text2:secondText,delimiter:delimiter,ignoredPrefix:ignoredPrefix})
        }else{
            result = PlainTextCompare({text1:firstText,text2:secondText})
        }

        setDiffComponent(result.component)
        setCompareResult(result.isSame)
        setShowDiff(!result.isSame)
        setShowResult(true)
    };

    const handleOnClear = () => {
        setFirstText('')
        setSecondText('')
        setShowResult(false)
        setShowDiff(false)
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        if ((showResult && compareResult)) {
          // Wait a tick for the DOM to update
          const timer = setTimeout(() => setMounted(true), 10);
          return () => clearTimeout(timer);
        } else {
          setMounted(false);
        }
      }, [showResult, compareResult]);


    return <div className='flex flex-col justify-center items-center w-full gap-4'>
        {showDiff && (
            <div className='flex flex-col justify-center items-center w-full'>
                <div className='bg-red-700 text-lg px-20 rounded-lg'>Text are different</div>
                <div className="w-5/6 flex flex-row justify-center gap-8 ">
                    {diffComponent}
                </div>
            </div>
        )}

        {showResult && compareResult && (
            <div className={`
            bg-green-700 text-lg px-20 rounded-lg
            transition-all duration-1000
            transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}>Text are same</div>
        )}

        <div className="flex flex-row justify-center w-full">
            <div className="w-5/6 flex flex-row justify-center gap-8 h-[400px]">
                <div className="w-1/2 min-h-[100px] border">
                    <InputTextBox value={firstText} onChange={handleFirstTextChange} ></InputTextBox>
                </div>
                <div className="flex flex-col w-1/8 justify-center items-center">
                    <CompareMethodOption setCompareMode={setCompareMode} compareMode={compareMode}></CompareMethodOption>
                    {compareMode === 'keyvalue' && (
                        <div className="flex flex-col justify-center mb-4">
                            <div className="flex flex-row items-center justify-between border">
                                <label className='text-center w-full px-2 border-r'>Delimiter</label>
                                <input
                                    type="text"
                                    value={delimiter}
                                    onChange={(e) => setDelimiter(e.target.value)}
                                    className="text-center w-8 h-full"
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between border">
                                <label  className='text-center w-full px-2 border-r'>Ignored Prefix</label>
                                <input
                                    type="text"
                                    value={ignoredPrefix}
                                    onChange={(e) => setIgnoredPrefix(e.target.value)}
                                    className="text-center w-8 h-full"
                                />
                            </div>
                        </div>
                    )}
                    <CompareButton onCompare={handleOnCompare} showResult={showResult} compareResult={compareResult} onClear={handleOnClear}></CompareButton>
                </div>
                <div className="border-1 w-1/2">
                    <InputTextBox value={secondText} onChange={handleSecondTextChange} ></InputTextBox>
                </div>
            </div>
        </div>
    </div>
}

export default function TextCompare(){
    return <div className="my-8">
        <Card></Card>
    </div>
}