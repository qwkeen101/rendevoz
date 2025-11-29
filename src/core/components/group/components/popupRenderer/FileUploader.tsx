import { Icon } from '@/components'
import { Colors, KEY } from '@/consts'
import { CSSProperties, memo, useEffect, useRef, useState } from 'react'
import FileSystem from '@/api/fileSystem'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import classNames from 'classnames'

export default memo(
  ({
    onUpload,
    accept,
    onlyLink = false,
    uploadClassName,
    style
  }: {
    onUpload: (filePath: string, fileType: string, fileName: string) => void
    accept?: string
    onlyLink?: boolean
    uploadClassName?: string
    style?: CSSProperties
  }) => {
    const [input, setInput] = useState('')
    const { t } = useTranslation()
    const [dragover, setDragover] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    return (
      <div className='flex flex-col gap-4' style={{ width: '100%', ...style }}>
        {!onlyLink && (
          <div
            className={classNames(
              'border flex flex-col cursor-pointer items-center justify-center rounded-lg light-hover transition-colors',
              uploadClassName,
              dragover ? 'primary-border-color border' : '!border-dashed'
            )}
            onDragOver={e => {
              e.preventDefault()
              setDragover(true)
            }}
            onDragLeave={e => {
              e.preventDefault()
              setDragover(false)
            }}
            onDrop={e => {
              e.preventDefault()
            }}
            onClick={() => {
              Global.commonOps?.upload({ accept }).then(res => {
                if (res instanceof File) {
                  if (res.type.startsWith('image')) {
                    FileSystem.saveImage(res).then(p => {
                      onUpload(p, res.type, res.name)
                    })
                    return
                  }
                  FileSystem.fs.writeFile(res, `/files/${res.name}`).then(p => {
                    if (p) {
                      onUpload(p, res.type, res.name)
                    }
                  })
                }
              })
            }}
          >
            <div className='transparent-font select-none font-size-12'>{t('general.Select file desc')}</div>
          </div>
        )}
        {!onlyLink && (
          <div className='w-full items-center flex select-none gap-3'>
            <div className='border-bottom w-full'></div>
            <div className='font-size-10 super-transparent-font'>OR</div>
            <div className='border-bottom w-full'></div>
          </div>
        )}
        <div className='flex rounded-md border'>
          <input
            ref={inputRef}
            className={'px-3 flex-1'}
            value={input}
            placeholder={t('general.Embed a link') + ': https://example.com'}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                onUpload(input, '', input)
              }
            }}
            onChange={e => setInput(e.target.value)}
          />
          <Icon
            onClick={() => {
              if (input) {
                onUpload(input, '', input)
              }
            }}
            size={18}
            name='park-link'
            className='p-2.5 border-left cursor-pointer light-hover'
          />
        </div>
      </div>
    )
  }
)
