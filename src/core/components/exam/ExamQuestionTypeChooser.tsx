import { IExamQuestion } from '~/typings'
import { memo } from 'react'
import { Button, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'

export default memo(({ onChange }: { onChange: (type: IExamQuestion['type']) => void }) => {
  const { t } = useTranslation()
  const questions = [
    {
      type: 'text',
      icon: 'park-align-text-left-one'
    },
    {
      type: 'singleSelect',
      icon: 'park-radio-two'
    },
    {
      type: 'multiSelect',
      icon: 'park-checkbox'
    },
    {
      type: 'cloze',
      icon: 'park-text'
    },
    {
      type: 'imageOcclusion',
      icon: 'park-picture-one'
    },
    {
      type: 'trueOrFalse',
      icon: 'park-check-one'
    },
    {
      type: 'number',
      icon: 'park-pound'
    },
    {
      type: 'date',
      icon: 'park-time'
    },
    {
      type: 'description',
      icon: 'park-info'
    }
  ] as {
    type: IExamQuestion['type']
    icon: string
  }[]
  return (
    <WithBorder className={'p-3'}>
      <div className={'small-transparent pl-2 pt-1 mb-2'}>{t('exam.Insert question')}</div>
      <div className={'grid gap-x-4 gap-y-3 grid-cols-3'}>
        {questions.map(i => (
          <Button.IconButton
            size={16}
            text={t(TYPE_TO_QUESTION_NAME[i.type])}
            smallText={false}
            icon={i.icon}
            onClick={() => onChange(i.type)}
            key={i.type}
          ></Button.IconButton>
        ))}
      </div>
    </WithBorder>
  )
})
