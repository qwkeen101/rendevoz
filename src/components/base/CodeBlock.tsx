import { css } from '@emotion/css'
import { CSSProperties, forwardRef, useRef, useState } from 'react'
import { useMergedRef } from '@/hooks'

export const CodeLanguageData = [
  'bat',
  'c',
  'clojure',
  'cpp',
  'csharp',
  'css',
  'dart',
  'dockerfile',
  'go',
  'html',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'less',
  'lua',
  'markdown',
  'mysql',
  'pascal',
  'perl',
  'php',
  'plaintext',
  'powershell',
  'python',
  'ruby',
  'rust',
  'scala',
  'scss',
  'shell',
  'sql',
  'swift',
  'typescript',
  'verilog',
  'xml',
  'yaml'
]
interface CodeBlockProps {
  onChange: (value: string) => void
  value: string
  height: number | string
  maxHeight: number | string
  style: CSSProperties
  language: (typeof CodeLanguageData)[0]
  darkMode: boolean
  editable: boolean
}
const clazz = css({
  '.monaco-editor-background': {
    backgroundColor: 'transparent'
  },
  '.monaco-editor .margin': {
    backgroundColor: 'transparent'
  },
  '.monaco-editor': {
    backgroundColor: 'transparent !important'
  }
})
