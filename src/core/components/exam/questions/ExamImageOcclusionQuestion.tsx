import { Box, IExamImageOcclusionQuestion, Point } from '~/typings'
import { memo, useRef, useState } from 'react'
import { AnimatePopover, Icon, Modal, WithBorder } from '@/components'
import FileUploader from '@/core/components/group/components/popupRenderer/FileUploader'
import { ObjectStore } from '@/api/stores'
import classnames from 'classnames'
import material from 'material-colors'
import ImageOcclusionPainter from '@/core/components/exam/questions/ImageOcclusionPainter'
import ImageShapeRenderer from '@/core/components/exam/questions/ImageShapeRenderer'
import { useExamMode } from '@/core/components/exam/useExamState'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
const colors = ['#f5d576', material.red['300'], material.blue['300'], material.green['200'], material.purple['200']]

export default memo(({ question }: { question: IExamImageOcclusionQuestion }) => {
  const { url, content } = question
  const [editorVisible, setEditorVisible] = useState(false)
  const mode = useExamMode()
  const { t } = useTranslation()
  const renderInner = () => {
    if (mode === 'test' || mode === 'history') {
      return (
        <>
          <div className={'relative'}>
            <img draggable={false} className={'w-full rounded-lg'} src={url} />
            {question.content.map((i, idx) => (
              <ImageShapeRenderer
                onChange={e => {
                  ObjectStore('examQuestion').updateOne({
                    id: question.id,
                    content: produce(question.content, draft => {
                      draft[idx] = { ...draft[idx], ...e }
                    })
                  })
                }}
                index={idx}
                test={mode === 'test'}
                history={mode === 'history'}
                {...i}
                key={i.id}
              />
            ))}
          </div>
        </>
      )
    }
    return (
      <div
        onClick={() => {
          setEditorVisible(true)
        }}
        className={'relative cursor-pointer overflow-hidden'}
      >
        <img draggable={false} className={'w-full rounded-lg'} src={url} />
        {question.content.map(i => (
          <ImageShapeRenderer {...i} key={i.id} />
        ))}
      </div>
    )
  }
  return (
    <div>
      {url ? (
        <>
          {renderInner()}
          <Modal zIndex={200} visible={editorVisible} onClose={() => setEditorVisible(false)}>
            <ImageOcclusionPainter question={question} colors={colors} />
          </Modal>
        </>
      ) : (
        <AnimatePopover
          align={'start'}
          positions={['bottom', 'top']}
          content={
            <WithBorder data-no-dnd className={'w-96'}>
              <FileUploader
                onUpload={p => {
                  ObjectStore('examQuestion').updateOne({ id: question.id, url: p })
                }}
                accept={'image/*'}
              />
            </WithBorder>
          }
        >
          <div className={'border light-hover font-medium cursor-pointer transition-colors flex !p-4 rounded-lg gap-3 items-center'}>
            <Icon size={18} name={'park-upload-picture'} />
            {t('general.Upload an image')}
          </div>
        </AnimatePopover>
      )}
    </div>
  )
})
