# @rendevoz/editor

A powerful rich text editor component based on Slate.js.

## Features

- Rich text editing with customizable elements
- Plugin系统
- 支持多种编辑器元素（块、内联、空白等）
- TypeScript support
- 基于 Slate.js 构建

## Installation

```bash
npm install @rendevoz/editor slate slate-react jotai
```

## Usage

```tsx
import { Editor } from '@rendevoz/editor'

function App() {
  const [content, setContent] = useState(initialValue)
  
  return (
    <Editor
      value={content}
      onChange={setContent}
      readOnly={false}
    />
  )
}
```

## API

### Editor Component

#### Props

- `value`: Editor content value
- `onChange`: Callback when content changes
- `readOnly`: Read-only mode
- `plugins`: Array of editor plugins

## License

MIT
