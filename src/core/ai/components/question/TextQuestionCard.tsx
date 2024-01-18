import { IQuestion } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { memo } from 'react'
import { Colors } from '@/consts'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { useTranslation } from 'react-i18next'

export default memo(
  ({
    question,
    styles,
    metaId
  }: {
    question: IQuestion & { questionType: 'text' }
    metaId?: number
    styles?: {
      smallFontSize?: number
      contentFontSize?: number
      titleFontSize?: number
    }
  }) => {
    const { t } = useTranslation()
    return (
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: styles?.smallFontSize, color: Colors.Font.Transparent, marginTop: 6 }}>{t('general.My answer')}</div>
        <SimpleEditor
          metaId={metaId}
          textareaMode={true}
          containerStyle={{
            minHeight: 110,
            cursor: 'text',
            borderRadius: 6,
            marginTop: 4,
            padding: 6,
            border: '1px solid var(--border-background)'
          }}
          changeOnBlur={true}
          fontSize={styles?.contentFontSize}
          value={question.answer}
          onChange={v => {
            ObjectStore('question').updateOne({ id: question.id, answer: v })
          }}
        />
      </div>
    )
  }
)
