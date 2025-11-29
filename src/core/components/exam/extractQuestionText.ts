import { IExamQuestion } from '~/typings'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'

export default (q: IExamQuestion): string => {
  switch (q.type) {
    case 'description': {
      return slateToMarkdown(q.description || [])
    }
    case 'cloze': {
      return slateToMarkdown(q.content || [])
    }
    case 'multiSelect':
    case 'singleSelect': {
      return q.choices
        .map(i => i.name)
        .filter(i => i)
        .map(i => `- ${i}`)
        .join(' ')
    }
    default:
      return ''
  }
}
