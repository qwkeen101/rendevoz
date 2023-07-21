import { css } from "@emotion/css";
import { CSSProperties, forwardRef, useRef, useState } from "react";
import MonacoEditor, { RefEditorInstance } from "@uiw/react-monacoeditor";
import { useMergedRef } from "@/hooks";

export const CodeLanguageData = [
  "bat",
  "c",
  "clojure",
  "cpp",
  "csharp",
  "css",
  "dart",
  "dockerfile",
  "go",
  "html",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "less",
  "lua",
  "markdown",
  "mysql",
  "pascal",
  "perl",
  "php",
  "plaintext",
  "powershell",
  "python",
  "ruby",
  "rust",
  "scala",
  "scss",
  "shell",
  "sql",
  "swift",
  "typescript",
  "verilog",
  "xml",
  "yaml",
];
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
const clazz = css({
  ".monaco-editor-background": {
    backgroundColor: "transparent",
  },
  ".monaco-editor .margin": {
    backgroundColor: "transparent",
  },
  ".monaco-editor": {
    backgroundColor: "transparent !important",
  },
});

const CodeBlock = forwardRef<RefEditorInstance, Partial<CodeBlockProps>>(
  (
    {
      onChange,
      value,
      height = "100%",
      style,
      language,
      darkMode = true,
      editable = true,
    },
    ref
  ) => {
    const [defaultValue] = useState(value);
    const innerRef = useRef<RefEditorInstance>(null);
    const mergedRef = useMergedRef(innerRef, ref);

    return (
      <MonacoEditor
        ref={mergedRef}
        className={clazz}
        language={language}
        height={height}
        style={style}
        onChange={(e, event) => {
          onChange?.(e);
        }}
        value={defaultValue}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        options={{
          theme: darkMode ? "vs-dark" : "vs-light",
          minimap: { enabled: false },
          cursorStyle: "line",
          roundedSelection: false,
          automaticLayout: true,
          selectOnLineNumbers: true,
          renderLineHighlight: "none",
          readOnly: !editable,
          padding: {
            bottom: 100,
            top: 12,
          },
          scrollBeyondLastLine: false,
        }}
      />
    );
  }
);

export default CodeBlock;
