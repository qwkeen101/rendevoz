import { memo, useEffect, useRef, useState } from 'react'
import getAllFilesAndFolders from '@/components/fileImporter/baidudisk/getAllFilesAndFolders'
import { Button, Content, Icon, IconWithPopover, Modal, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { assignProperties, DateFormat } from '@/utils'
import { Colors } from '@/consts'
import { IBaidudiskInstance, MetaObject } from '~/typings'
import searchFiles from '@/components/fileImporter/baidudisk/searchFiles'
import { useDebounceEffect } from '@/hooks'
import {
  categorizeFilesByPath,
  handleImportAllAndCreateCollections,
  normalizeGroupToCollections
} from '@/components/fileImporter/baidudisk/handleImportAllAndCreateCollections'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'

type BaiduFile = {
  category: number
  isdir: 1 | 0
  path: string
  size: number
  filename: string
  fs_id: number
  createdAt: number
}

export const BaidudiskInstance: IBaidudiskInstance = {}

const BaidudiskDisplayer = ({
  onChooseFolder,
  onChooseFile,
  onlyVisibleCategory,
  onCreateMeta
}: {
  onChooseFolder?: (folder: BaiduFile) => void
  onChooseFile?: (file: BaiduFile) => void
  onCreateMeta?: (m: MetaObject) => void
  onlyVisibleCategory?: number
}) => {
  const [currentDir, setCurrentDir] = useState('')

  const [dirState, setDirState] = useState<
    {
      path: string
      files: BaiduFile[]
    }[]
  >([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{
    files: BaiduFile[]
  }>()
  useDebounceEffect(
    () => {
      if (search) {
        searchFiles(search, onlyVisibleCategory).then(res => {
          if (res) {
            if (res.list) {
              setSearchResults({
                files: res.list.map(i => ({ ...i, filename: i.server_filename, createdAt: i.server_ctime * 1000 }))
              })
            }
          }
        })
      } else {
        setSearchResults(undefined)
      }
    },
    [search],
    { wait: 500 }
  )
  useEffect(() => {
    if (dirState.some(i => i.path === currentDir)) return
    getAllFilesAndFolders(currentDir).then(data => {
      if (data?.list || data?.info) {
        setDirState(currentState => {
          const index = currentState.findIndex(i => i.path === currentDir)
          if (index >= 0) {
            return currentState
          }
          return [
            ...currentState,
            {
              path: currentDir,
              files: (data.list || data.info).map(i => ({
                ...i,
                filename: i.server_filename,
                createdAt: i.server_ctime * 1000
              }))
            }
          ]
        })
      }
    })
  }, [currentDir, onlyVisibleCategory])
  const prevDirname = useRef(currentDir)
  console.log(dirState)
  if (dirState || searchResults) {
    return (
      <>
        <Content flex column style={{ height: '100%', width: '100%', borderRadius: 16, overflow: 'hidden', padding: '16px 0px' }}>
          <div style={{ padding: '4px 24px' }} className={ClassName.title()}>
            选取文件
          </div>
          {dirState.length > 1 && <div style={{ fontSize: 13, color: Colors.Font.Transparent, padding: '0px 24px 4px' }}>{currentDir}</div>}
          <Content flex alignItems={'center'} gap={14} style={{ padding: '3px 24px 0px' }}>
            {dirState.length > 1 && (
              <Icon
                name={'park-left'}
                className={ClassName.circleButton()}
                onClick={() => {
                  dirState.pop()
                  setDirState([...dirState])
                  setCurrentDir(dirState[dirState.length - 1].path)
                }}
              ></Icon>
            )}
            <Content flex alignItems="center" auto gap={8}>
              <Icon name={'park-search'} />
              <input
                placeholder={'搜索文件'}
                className={ClassName.noStyleInput}
                style={{
                  width: '100%',
                  borderBottom: `1px solid ${Colors.Background.Border}`
                }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Content>
            <IconWithPopover
              className={ClassName.circleButton()}
              content={
                <WithBorder padding={6}>
                  <Button.IconButton
                    text={'导入当前文件夹内所有文件'}
                    onClick={() => {
                      handleImportAllAndCreateCollections(currentDir).then(data => {
                        const group = categorizeFilesByPath(data, currentDir)
                        normalizeGroupToCollections(group)
                      })
                    }}
                  />
                  <Button.IconButton
                    text={'重新登录'}
                    onClick={() => {
                      loginBaidudisk()
                    }}
                  />
                </WithBorder>
              }
              name={'park-more'}
              padding={10}
              placement={['bottom']}
            ></IconWithPopover>
          </Content>
          <Content style={{ width: '100%', height: 0, flex: 1 }}>
            {searchResults ? (
              <Content
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '10px 16px'
                }}
              >
                {searchResults.files?.map(i => (
                  <FileItemRenderer
                    file={i}
                    key={i.fs_id}
                    onClick={() => {
                      {
                        if (i.isdir) {
                          onChooseFolder?.(i)
                          prevDirname.current = currentDir
                          setCurrentDir(i.path)
                        } else {
                          onChooseFile?.(i)
                        }
                      }
                    }}
                  />
                ))}
              </Content>
            ) : (
              <>
                {dirState?.map((dir, idx) => (
                  <Content
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: idx,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '10px 16px',
                      display: idx === dirState.length - 1 ? 'block' : 'none'
                    }}
                  >
                    {dir.files?.map(i => (
                      <FileItemRenderer
                        file={i}
                        key={i.fs_id}
                        onClick={() => {
                          {
                            if (i.isdir) {
                              onChooseFolder?.(i)
                              prevDirname.current = currentDir
                              setCurrentDir(i.path)
                            } else {
                              onChooseFile?.(i)
                            }
                          }
                        }}
                      />
                    ))}
                  </Content>
                ))}
              </>
            )}
          </Content>
        </Content>
      </>
    )
  }
  return null
}

const categoryToIcon = {
  1: 'park-video-file',
  2: 'park-audio-file',
  3: 'park-image-files',
  4: 'park-file-doc',
  7: 'park-link'
}

function formatBytes(a, b = 2) {
  if (!+a) return '0 Bytes'
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024))
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]}`
}

const FileItemRenderer = ({ file, onClick }: { file: BaiduFile; onClick: VoidFunction }) => {
  return (
    <Content className={ClassName.flatButton()} onClick={onClick}>
      <Content flex gap={8}>
        {file.isdir === 1 && <Icon name={'park-folder-close'} />}
        {categoryToIcon[file.category] && <Icon name={categoryToIcon[file.category]} />}
        {file.filename}
      </Content>
      <Content flex gap={10} className={ClassName.description(FontSize['12px'])}>
        {file.size !== 0 && <span>{formatBytes(file.size)}</span>}
        <span>{DateFormat.format(file.createdAt, DateFormat.Formats.withMinute)}</span>
      </Content>
    </Content>
  )
}

export const GlobalBaidudisk = memo(() => {
  const [visible, setVisible] = useState(false)
  const [category, setCategory] = useState<number>()
  const shouldClose = useRef(false)
  const resrejRef = useRef<[(v: string) => void, VoidFunction]>()
  assignProperties(BaidudiskInstance, {
    chooseFile: (category, closeAfterChoose) => {
      if (category) {
        setCategory(category)
      }
      shouldClose.current = closeAfterChoose
      return new Promise((res, rej) => {
        setVisible(true)
        resrejRef.current = [res, rej]
      })
    }
  })
  if (visible === false) {
    BaidudiskInstance.onChooseFile = undefined
  }
  return (
    <Modal
      zIndex={5000}
      visible={visible}
      style={{
        width: 'min(60vw, 800px)',
        height: `min(80vh, 800px)`
      }}
      onClose={() => {
        setVisible(false)
        resrejRef.current?.[1]()
        resrejRef.current = undefined
      }}
    >
      <BaidudiskDisplayer
        onlyVisibleCategory={category}
        onCreateMeta={v => {
          BaidudiskInstance.onCreateMeta?.(v)
        }}
        onChooseFile={file => {
          BaidudiskInstance.onChooseFile?.(file)
          if (shouldClose.current) {
            setVisible(false)
          }
          shouldClose.current = undefined
          if (category) {
            if (category === file.category) {
              resrejRef.current?.[0](file)
            }
          } else {
            resrejRef.current?.[0](file)
          }
        }}
      />
    </Modal>
  )
})

export default BaidudiskDisplayer
