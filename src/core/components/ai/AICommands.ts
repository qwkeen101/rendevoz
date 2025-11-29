import { IAIActions } from '@/core/ai/chat/ChatDialog'
import trans from '@/consts/trans'
import { Icons } from '@/consts'

export default {
  quiz: {
    key: 'quiz',
    text: 'ai.Make a quiz',
    icon: 'park-editor'
  },
  insight: {
    key: 'insight',
    text: trans.AI.Summarize,
    icon: 'custom-stars'
  },
  overview: {
    key: 'overview',
    text: 'ai.Summarize briefly',
    icon: 'park-write'
  },
  mindmap: {
    key: 'mindmap',
    text: 'ai.Make a mindmap',
    icon: 'park-mindmap-map'
  },
  points: {
    key: 'points',
    text: 'ai.Extract points',
    icon: 'park-star'
  },
  table: {
    key: 'table',
    text: 'ai.Create summary table',
    icon: 'park-table-file'
  },
  outline: {
    key: 'outline',
    text: 'ai.List contents',
    icon: 'custom-list'
  },
  background: {
    key: 'background',
    text: 'ai.Provide background',
    icon: 'park-info',
    className: 'text-blue-500'
  },
  question: {
    key: 'question',
    text: 'ai.Ask questions',
    icon: Icons.Search
  }
} as Record<
  IAIActions,
  {
    key: IAIActions
    text: string
    icon: string
    className: string
  }
>
