import { IExamQuestion } from '~/typings'

export const TYPE_TO_QUESTION_NAME: Record<IExamQuestion['type'], string> = {
  date: 'exam.question.Date',
  cloze: 'exam.question.Cloze',
  description: 'exam.question.Description',
  imageOcclusion: 'exam.question.ImageOcclusion',
  location: 'exam.question.Date',
  singleSelect: 'exam.question.SingleSelect',
  multiSelect: 'exam.question.MultiSelect',
  number: 'exam.question.Number',
  trueOrFalse: 'exam.question.TrueOrFalse',
  text: 'exam.question.Text'
}
