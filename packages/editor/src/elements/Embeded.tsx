import { ReactEditor, RenderElementProps, useGlobalIsDragging, useSlateStatic } from '@/core'
import { Colors } from '@/consts'
import { memo, useEffect, useState } from 'react'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import FileUploader from '@/core/components/group/components/popupRenderer/FileUploader'
import { Transforms } from 'slate'
import { IFrameElement } from '~/typings'
import useIsSelecting from '../hooks/useIsSelecting'
import { useIsIn } from '@/hooks'
import useEditorInstance from '../hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
import ResizeWrapper from '../elements/ResizeWrapper'

export default memo(({ children, element }: RenderElementProps) => {
  const editor = useSlateStatic()
  const embededEle = element as IFrameElement
  const [formVisible, setFormVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const [isSelecting] = useIsSelecting()
  const { isIn, ref } = useIsIn()
  const instance = useEditorInstance()
  const { t } = useTranslation()
  useEffect(() => {
    instance.blockOps?.setBlockFuncs(element.id, {
      openTypeUrlForm: () => {
        setFormVisible(true)
      }
    })
  }, [])
  if (embededEle.url) {
    let url = embededEle.url
    if (url.includes('www.youtube.com/watch?v')) {
      try {
        const videoId = new URL(url).searchParams.get('v')
        url = 'https://www.youtube.com/embed/' + videoId
      } catch (e) {}
    }
    return (
      <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} contentEditable={'false'}>
        <ResizeWrapper
          element={element}
          enable={{
            bottom: true,
            left: true,
            right: true
          }}
          defaultSize={{
            width: '100%',
            height: 400
          }}
          style={{
            background: Colors.Background.Secondary
          }}
          maxWidth={'100%'}
        >
          <AnimatePopover
            onClickOutside={() => setFormVisible(false)}
            onVisiblityChange={v => setFormVisible(v)}
            visible={formVisible}
            withClickCover={true}
            positions={['bottom', 'top']}
            content={
              <WithBorder width={300}>
                <FileUploader
                  onlyLink
                  onUpload={s => {
                    setFormVisible(false)
                    Transforms.setNodes(
                      editor,
                      {
                        url: s
                      },
                      {
                        at: ReactEditor.findPath(editor, element)
                      }
                    )
                  }}
                />
              </WithBorder>
            }
          >
            <div style={{ width: '100%', height: 0, position: 'absolute', top: 0 }}></div>
          </AnimatePopover>
          <webview
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 6,
              height: '100%',
              pointerEvents: isSelecting || globalIsDragging ? 'none' : 'auto',
              overflow: 'hidden'
            }}
            src={url}
          />
        </ResizeWrapper>
        {children}
      </div>
    )
  }
  return (
    <div
      className={'transparent-font selectable bg-third'}
      style={{
        width: '100%',
        borderRadius: '0.5em'
      }}
      contentEditable={'false'}
    >
      <AnimatePopover
        onClickOutside={() => setFormVisible(false)}
        onVisiblityChange={v => setFormVisible(v)}
        visible={formVisible}
        withClickCover={true}
        positions={['bottom', 'top']}
        content={
          <WithBorder width={300}>
            <FileUploader
              onlyLink
              onUpload={s => {
                setFormVisible(false)
                Transforms.setNodes(
                  editor,
                  {
                    url: s
                  },
                  {
                    at: ReactEditor.findPath(editor, element)
                  }
                )
              }}
            />
          </WithBorder>
        }
      >
        <div
          onClick={() => setFormVisible(true)}
          className={'button w-full flex items-center'}
          style={{
            padding: '1em 2.5em 1em 1em',
            gap: '1em'
          }}
        >
          <Icon size={20} name={'park-link-one'} />
          {t('editor.Embed a link')}
        </div>
      </AnimatePopover>
      {children}
    </div>
  )
})
