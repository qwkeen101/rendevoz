import { IMetaProperty, MetaObject } from '~/typings'
import { CSSProperties } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import { PopupWrapper } from '@/core/components/group/components'
import FileUploader from '@/core/components/group/components/popupRenderer/FileUploader'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'

type FileValue = (IMetaProperty & { propType: 'file' })['value']
export default ({
  value,
  style,
  onChange,
  className,
  optionStyle
}: {
  value?: FileValue
  style?: CSSProperties
  className?: string
  onChange?: (file: FileValue) => void
  optionStyle?: CSSProperties
}) => {
  const currFiles = value
  const { openPopover, closePopover, renderPopover } = usePopoverCell()
  return (
    <>
      <Content
        flex
        className={className}
        role={'prop-container'}
        gap={'6px 8px'}
        style={{
          width: '100%',
          flexWrap: 'inherit',
          ...style
        }}
        onClick={e => {
          const p = e.currentTarget.parentElement
          if (p) {
            openPopover(p)
          }
        }}
      >
        {currFiles?.map(i =>
          i.type.startsWith('image') ? (
            <img key={i.path} src={i.path} style={{ maxHeight: '22px' }} />
          ) : (
            <span
              style={{
                background: Colors.Background.Secondary,
                borderRadius: 4,
                padding: '0px 6px',
                height: 22,
                lineHeight: '22px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: 14,
                ...optionStyle
              }}
              key={i.path}
            >
              {i.name}
            </span>
          )
        )}
      </Content>
      {renderPopover(box => (
        <PopupWrapper style={{ fontSize: 14 }} box={box}>
          {currFiles?.length ? (
            <div
              style={{
                padding: 4,
                width: '100%',
                borderBottom: Colors.Consts.Border
              }}
            >
              {currFiles?.map(i => (
                <Content
                  onClick={() => {
                    window.open(i.path)
                  }}
                  flex
                  gap={8}
                  key={i.path}
                  className={ClassName.flatButton()}
                >
                  {i.type.startsWith('image') ? (
                    <div
                      style={{
                        flex: 'auto',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        style={{
                          maxWidth: '100%',
                          maxHeight: 180
                        }}
                        src={i.path}
                      />
                    </div>
                  ) : (
                    <div className={ClassName.ellipsisFont(1)}>{i.name}</div>
                  )}
                  <Icon
                    name={'park-delete'}
                    size={14}
                    onClick={e => {
                      e.stopPropagation()
                      onChange?.(currFiles.filter(o => o !== i))
                    }}
                    containerStyle={{
                      marginLeft: 'auto',
                      flexShrink: 0,
                      height: 'fit-content'
                    }}
                    className={ClassName.flatButton(4, '5px')}
                  />
                </Content>
              ))}
            </div>
          ) : undefined}
          <AnimatePopover
            positions={['bottom', 'top']}
            reposition
            align={'start'}
            withClickCover={true}
            content={setV => (
              <WithBorder width={280}>
                <FileUploader
                  onUpload={(filePath, fileType, fileName) => {
                    onChange?.([
                      ...(currFiles || []),
                      {
                        name: fileName,
                        type: fileType,
                        path: filePath
                      }
                    ])
                    setV(false)
                  }}
                />
              </WithBorder>
            )}
          >
            <div
              style={{
                padding: 4,
                width: '100%'
              }}
            >
              <Button.IconButton text={'Add a file or image'} icon={'park-plus'}></Button.IconButton>
            </div>
          </AnimatePopover>
        </PopupWrapper>
      ))}
    </>
  )
}
