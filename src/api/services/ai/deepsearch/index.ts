import turnQueryToQuestions from '@/api/services/ai/deepsearch/turnQueryToQuestions'
import runSearchTask, { IAISearchTask } from '@/api/services/ai/deepsearch/runSearchTask'
import { Id } from '@/utils'
import produce from 'immer'
import writeFinalReport from '@/api/services/ai/deepsearch/writeFinalReport'

export type IAIResearchRound = {
  tasks: IAISearchTask[]
  summary: string
}

export default async (query: string, opts: {}) => {
  const questions = await turnQueryToQuestions(query)
  let tasks: IAISearchTask[] = questions.questions.map(i => ({
    id: Id.getId(),
    state: 'unprocessed',
    query: i.query,
    researchGoal: i.goal,
    sources: [],
    scholar: false,
    web: true
  }))
  console.log(questions)
  await runSearchTask(tasks, task => {
    tasks = produce(tasks, draft => {
      const targetTask = draft.findIndex(i => i.id === task.id)
      if (targetTask >= 0) {
        draft[targetTask] = { ...draft[targetTask], ...task }
      }
    })
  })
  await writeFinalReport(query, tasks)
}
