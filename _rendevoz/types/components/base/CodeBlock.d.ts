import { CSSProperties } from "react";
import { RefEditorInstance } from "@uiw/react-monacoeditor";

export declare const CodeLanguageData: string[];
interface CodeBlockProps {
    onChange: (value: string) => void;
    value: string;
    height: number | string;
    maxHeight: number | string;
    style: CSSProperties;
    language: (typeof CodeLanguageData)[0];
    darkMode: boolean;
    editable: boolean;
}
declare const CodeBlock: import("react").ForwardRefExoticComponent<Partial<CodeBlockProps> & import("react").RefAttributes<RefEditorInstance>>;
export default CodeBlock;
