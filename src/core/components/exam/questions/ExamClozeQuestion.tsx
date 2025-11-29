import { IEditorInstance, IExamClozeQuestion } from '~/typings'
import { createContext, memo, RefObject, useRef } from 'react'
import { Id } from '@/utils'
import { Transforms, Editor as SlateEditor, Node } from 'slate'
import { ToolbarV2 } from '@/components'
import FileSystem from '@/api/fileSystem'
import { ObjectStore } from '@/api/stores'
import { useExamMode } from '@/core/components/exam/useExamState'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TextEditor } from '@/core'

export const ClozeModeContext = createContext<'edit' | 'test' | 'history'>('edit')
export default memo(({ question, showAnswer }: { question: IExamClozeQuestion; showAnswer?: boolean }) => {
  const { content, id } = question
  const mode = useExamMode()
  const instanceRef = useRef<IEditorInstance>()
  return (
    <>
      <div className={classnames('relative', mode !== 'history' && 'exam-cloze-question')}>
        {mode === 'edit' && <Toolbar instanceRef={instanceRef} />}
        <div className={'relative'}>
          <ClozeModeContext.Provider value={mode}>
            <TextEditor
              onInstanceInitialized={i => (instanceRef.current = i)}
              fontSize={mode === 'display' ? 11 : 14}
              readOnly={mode !== 'edit'}
              defaultValue={content}
              onChange={e => {
                ObjectStore('examQuestion').updateOne({ id, content: e })
              }}
              placeholder={''}
            />
          </ClozeModeContext.Provider>
        </div>
      </div>
      {mode === 'history' && <ValueChecker content={content} />}
    </>
  )
})

const Toolbar = ({ instanceRef }: { instanceRef: RefObject<IEditorInstance> }) => {
  const { t } = useTranslation()
  return (
    <div
      onPointerDownCapture={e => {
        e.preventDefault()
      }}
      className={'border-bottom p-1.5'}
    >
      <ToolbarV2
        className={'!p-0 gap-1'}
        layout={[
          {
            type: 'button',
            icon: 'park-picture',
            key: 'pic',
            text: t('exam.Image'),
            onClick: () => {
              const editor = instanceRef.current?.editor
              if (editor) {
                Global.commonOps
                  ?.upload({
                    accept: 'image/*'
                  })
                  .then(res => {
                    if (res instanceof File) {
                      FileSystem.saveImage(res).then(res => {
                        Transforms.insertNodes(editor, {
                          type: 'inline-image',
                          id: Id.getId(),
                          children: [{ text: '' }],
                          url: res
                        })
                      })
                    }
                  })
              }
            }
          },
          {
            type: 'button',
            icon: 'park-text',
            key: 'cloze',
            text: t('exam.Cloze'),
            onClick: () => {
              const editor = instanceRef.current?.editor
              if (editor) {
                Transforms.insertNodes(editor, {
                  type: 'cloze',
                  id: Id.getId(),
                  children: [{ text: '' }],
                  content: '',
                  answer: editor.selection ? SlateEditor.string(editor, editor.selection) : ''
                })
              }
            }
          },
          {
            type: 'button',
            icon: 'custom-list',
            key: 'select',
            text: t('exam.Select'),
            onClick: () => {
              const editor = instanceRef.current?.editor
              if (editor) {
                Transforms.insertNodes(editor, {
                  type: 'select',
                  id: Id.getId(),
                  children: [{ text: '' }],
                  content: []
                })
              }
            }
          }
        ]}
      />
    </div>
  )
}

const ValueChecker = ({ content }: { content: IExamClozeQuestion['content'] }) => {
  const allClozes = Array.from(Node.elements({ children: content || [] }))
    .filter(i => i[0].type === 'cloze' || i[0].type === 'select')
    .map(i => i[0])
  const { t } = useTranslation()
  return (
    <div>
      <div className={'font-medium mb-2 mt-5'}>{t('exam.Your answer')}</div>
      <div className={'flex exam-history-item flex-wrap gap-5'}>
        {allClozes.map((i, idx) => (
          <div
            className={classnames(
              i.type === 'cloze' && i.answer && i.value !== i.answer && 'text-red-500',
              i.type === 'select' && i.content.some(i => i.answer && !i.value) && 'text-red-500'
            )}
            key={i.id}
          >
            {idx + 1}. {i.type === 'cloze' ? i.value : i.type === 'select' ? i.content.find(i => i.value)?.name : ''}
          </div>
        ))}
      </div>
      <div className={'font-medium mb-2 mt-5'}>{t('exam.Correct answer')}</div>
      <div className={'flex exam-history-item flex-wrap gap-5'}>
        {allClozes.map((i, idx) => (
          <div key={i.id}>
            {idx + 1}. {i.type === 'cloze' ? i.answer : i.type === 'select' ? i.content.find(i => i.answer)?.name : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
