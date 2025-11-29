import classnames from 'classnames'
import { Icon } from '@/components'
import { memo, useState } from 'react'
import { formatBytes } from '@/utils/fetchProcess'
import { IFolder } from '~/typings'
import { useAtom } from 'jotai'
import { ImportStateAtom } from '@/api/components/objectImporter/ObjectFileUploader'
import { useTranslation } from 'react-i18next'

export default memo(() => {
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useAtom(ImportStateAtom)
  const { files, folders } = uploaded
  const { t } = useTranslation()
  const formatFolder = (f: IFolder) => {
    const strs = [`${formatBytes(f.size, 1)}`]
    if (f.folders.length) {
      strs.push(`${f.folders.length} folders`)
    }
    if (f.files.length) {
      strs.push(`${f.files.length} files`)
    }
    return strs.join(' · ')
  }
  const totalLength = folders.length + files.length
  return (
    <div className={'pt-6 w-full'}>
      <div className={'px-6 w-full'}>
        <div
          onClick={() => {
            Global.commonOps
              ?.upload?.({
                multiple: true
              })
              .then(f => {
                const files = Array.isArray(f) ? f : [f]
                setUploaded(s => ({
                  ...s,
                  files: [...files.filter(i => !s.files.some(o => o.name === i.name)), ...s.files]
                }))
              })
          }}
          onDragOver={e => {
            setDragOver(true)
            e.preventDefault()
          }}
          onDrop={async e => {
            e.preventDefault()
            const fileHandles = await Promise.all(
              [...e.dataTransfer.items].filter(i => i.kind === 'file').map(async i => i.getAsFileSystemHandle())
            )
            let foldersArr: typeof folders = []
            let filesArr: typeof files = []
            for await (const handle of fileHandles) {
              if (handle) {
                if (handle.kind === 'directory') {
                  foldersArr.push(await getNestedFolder(handle as FileSystemDirectoryHandle))
                }
                if (handle.kind === 'file') {
                  filesArr.push(await (handle as FileSystemFileHandle).getFile())
                }
              }
            }
            setUploaded(s => ({
              ...s,
              folders: [...foldersArr, ...s.folders.filter(i => !foldersArr.some(o => o.name === i.name))],
              files: [...filesArr, ...s.files.filter(i => !filesArr.some(o => o.name === i.name))]
            }))
            setDragOver(false)
          }}
          onDragLeave={() => setDragOver(false)}
          className={classnames(
            'border cursor-pointer light-hover transition-colors !border-dashed w-full h-52 rounded-xl font-size-13 px-6 text-center flex flex-col items-center justify-center',
            dragOver && 'select-color-border select-color-super-transparent-bg',
            totalLength && 'mb-3'
          )}
        >
          <Icon size={20} strokeWidth={4} className={'mb-3'} name={'park-upload'} />
          <div>{t('general.Select file desc')}</div>
        </div>
      </div>
      <div className={'w-full max-h-96 px-6 pb-6 overflow-y-auto'}>
        {folders.map((i, idx) => (
          <div className={classnames('flex items-center gap-3', idx === totalLength - 1 ? 'pt-3' : 'py-3 border-bottom')} key={i.name}>
            <div className={'flex-1'}>
              <div className={'font-size-13 break-all line-clamp-1'}>{i.name}</div>
              <div className={'transparent-font font-size-12'}>{formatFolder(i)}</div>
            </div>
            <Icon
              onClick={() => setUploaded(f => ({ ...f, folders: f.folders.filter(o => o.name !== i.name) }))}
              style={{ transition: 'all 0.3s ease' }}
              className={'hover-active-button'}
              name={'park-close-one'}
              strokeWidth={4}
              size={18}
            />
          </div>
        ))}
        {files.map((i, idx) => (
          <div
            className={classnames('flex items-center gap-3', idx + folders.length === totalLength - 1 ? 'pt-3' : 'py-3 border-bottom')}
            key={i.name}
          >
            <div className={'flex-1'}>
              <div className={'font-size-13 break-all line-clamp-1'}>{i.name}</div>
              <div className={'transparent-font font-size-12'}>{formatBytes(i.size, 1)}</div>
            </div>
            <Icon
              onClick={() => setUploaded(f => ({ ...f, files: f.files.filter(o => o.name !== i.name) }))}
              style={{ transition: 'all 0.3s ease' }}
              className={'hover-active-button'}
              name={'park-close-one'}
              strokeWidth={4}
              size={18}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

const getNestedFolder = async (handle: FileSystemDirectoryHandle) => {
  const res: IFolder = {
    name: handle.name,
    size: 0,
    files: [],
    folders: []
  }
  const childrenHandles = await Array.fromAsync(handle.values())
  await Promise.all(
    childrenHandles.map(async handle => {
      if (handle.kind === 'file') {
        const fileHandle = handle as FileSystemFileHandle
        const file = await fileHandle.getFile()
        res.files.push(file)
        res.size += file.size
      } else {
        const dirHandle = handle as FileSystemDirectoryHandle
        const dir = await getNestedFolder(dirHandle)
        res.folders.push(dir)
        res.size += dir.size
      }
    })
  )
  return res
}
