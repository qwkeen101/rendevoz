import { useRef } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { Button, Content, AnimatePopover, WithBorder } from '@/components'
import { PopupWrapper } from '@/core/components/group/components'
import ImageRenderer from '@/core/components/group/components/popupRenderer/ImageRenderer'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import FileUploader from '@/core/components/group/components/popupRenderer/FileUploader'
import { useTranslation } from 'react-i18next'

export default ({
  value,
  onChange,
  onClick,
  isEditing
}: {
  value?: string
  onChange: (filePath?: string) => void
  onClick?: React.MouseEventHandler
  isEditing?: boolean
}) => {
  const ref = useRef(null)
  const fitImage = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.fitImage) ?? false
  const { openPopover, renderPopover, closePopover } = usePopoverCell({
    targetRef: ref
  })
  const { t } = useTranslation()
  return (
    <>
      <Content
        flex
        justifyContent={'space-between'}
        onClick={e => {
          onClick?.(e)
          if (e.defaultPrevented) return
          const parent = e.currentTarget.parentElement
          if (parent && value) {
            openPopover(parent)
          }
        }}
        style={{
          width: '100%',
          position: 'relative',
          aspectRatio: '16 / 9',
          overflow: 'hidden'
        }}
      >
        {value && (
          <img
            loading={'lazy'}
            style={{
              objectFit: fitImage ? 'contain' : 'cover',
              width: '100%',
              height: '100%'
            }}
            src={value}
          />
        )}
        {!value && isEditing && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AnimatePopover
              reposition
              positions={['bottom', 'top']}
              content={setV => (
                <WithBorder width={280}>
                  <FileUploader
                    accept={'image/*'}
                    onUpload={filePath => {
                      setV(false)
                      console.log(filePath)
                      onChange?.(filePath)
                    }}
                  />
                </WithBorder>
              )}
              withClickCover={true}
            >
              <Button.IconButton
                ref={ref}
                className={'transparent-font'}
                text={t('general.Upload an image')}
                icon={'park-upload-picture'}
                style={{
                  margin: 'auto'
                }}
              />
            </AnimatePopover>
          </div>
        )}
      </Content>
      {renderPopover(box => (
        <PopupWrapper
          box={{ ...box, width: Math.min(500, Math.max(box.width, 320)) }}
          style={{
            borderRadius: '0.75rem',
            overflow: 'hidden'
          }}
        >
          <ImageRenderer
            value={value}
            onDelete={() => {
              onChange(undefined)
              closePopover()
            }}
            onChange={v => onChange(v)}
          />
        </PopupWrapper>
      ))}
    </>
  )
}
