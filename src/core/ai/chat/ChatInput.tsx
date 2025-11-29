import { memo, useRef, useState } from 'react'
import { AutosizeTextarea, Button, Icon } from '@/components'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import AISetting from '@/core/ai/chat/AISetting'
import { CoreMessage, ImagePart } from 'ai'
export default memo(
  ({
    onAsk,
    isLoading,
    reasoning,
    web,
    onReasoning,
    onWeb,
    onCreateChat
  }: {
    onAsk?: (input: string | CoreMessage['content']) => void
    isLoading?: boolean
    reasoning?: boolean
    web?: boolean
    onReasoning?: VoidFunction
    onCreateChat?: VoidFunction
    onWeb?: VoidFunction
  }) => {
    const [value, setValue] = useState<string>('')
    const [image, setImage] = useState<string[]>([])
    const inputRef = useRef<HTMLDivElement>(null)
    const handleAsk = () => {
      if (isLoading) return
      if (!value && !image.length) return
      setValue('')
      setImage([])
      inputRef.current!.innerHTML = ''
      if (image.length) {
        onAsk?.([
          {
            type: 'text',
            text: value
          },
          ...image.map(
            i =>
              ({
                type: 'image',
                image: i
              }) as ImagePart
          )
        ])
      } else {
        onAsk?.(value)
      }
    }
    const { t } = useTranslation()
    return (
      <>
        <div className={'flex items-center gap-2 mb-2 mt-2'}>
          <div className={'flex items-center gap-1.5 w-full'}>
            <AISetting />
            <Icon onClick={() => {}} size={16} name={'park-screenshot'} className={'square-button size-7 ml-1'} />
            <Icon
              onClick={() => {
                Global.commonOps
                  ?.upload({
                    accept: 'image/*'
                  })
                  .then(async res => {
                    inputRef.current?.focus()
                    if (res instanceof File) {
                      const reader = new FileReader()
                      reader.onload = e => {
                        const url = e.target!.result as string
                        if (!image.some(i => i === url)) {
                          setImage([...image, url])
                        }
                      }
                      reader.readAsDataURL(res)
                    }
                  })
              }}
              size={18}
              name={'park-link'}
              className={'square-button-small size-7'}
            />
            <Icon name={'park-time'} className={'square-button size-7 ml-auto'} size={16} />
            <Icon
              name={'park-add-one'}
              onClick={onCreateChat}
              theme={'filled'}
              className={'square-button select-color-font size-7'}
              size={18}
            />
          </div>
        </div>
        <div className={'em:px-3 em:py-2 focus-within-input border-box-shadow rounded-xl relative'}>
          {image.length ? (
            <div className={'flex flex-wrap em:gap-3 em:mb-3 em:pt-1'}>
              {image.map(i => (
                <div key={i} className={'relative group'}>
                  <Icon
                    name={'park-close'}
                    size={10}
                    onClick={() => {
                      setImage(imgs => imgs.filter(o => o !== i))
                    }}
                    className={
                      '!absolute group-hover:opacity-100 opacity-0 transition-opacity p-1 border-box-shadow rounded-full cursor-pointer bg-popover right-0 top-0 translate-x-1/2 -translate-y-1/2'
                    }
                  />
                  <img
                    onClick={() => {
                      Global.commonOps?.previewImage?.(i)
                    }}
                    className={'rounded-lg cursor-pointer w-24'}
                    src={i}
                  />
                </div>
              ))}
            </div>
          ) : null}
          <AutosizeTextarea
            placeholder={t('ai.Send a message')}
            ref={inputRef}
            defaultValue={value}
            onChange={v => setValue(v)}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                handleAsk()
              }
            }}
            autoFocus
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              flexGrow: 1,
              fontSize: '0.95em',
              maxWidth: '100%',
              width: value?.length && value.includes('\n') ? '100%' : undefined,
              minHeight: '1.8lh'
            }}
          ></AutosizeTextarea>

          <div
            onClick={() => {
              inputRef.current?.focus()
            }}
            onPointerDown={e => {
              e.preventDefault()
            }}
            className={'flex cursor-text justify-end'}
          >
            <Icon
              onClick={e => {
                e.stopPropagation()
                handleAsk()
              }}
              spin={isLoading}
              name={isLoading ? Icons.Loading : 'park-arrow-up'}
              strokeWidth={6}
              size={14}
              style={{
                opacity: value && !isLoading ? 1 : 0.25,
                cursor: value && !isLoading ? 'pointer' : 'not-allowed'
              }}
              className={'!rounded-full em:p-1.5 shrink-0 items-center justify-center flex reverse-theme-button'}
            />
          </div>
        </div>
      </>
    )
  }
)
