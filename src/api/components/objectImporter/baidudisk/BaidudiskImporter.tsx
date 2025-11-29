import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDebounceEffect } from '@/hooks'
import searchFiles from '@/api/components/objectImporter/baidudisk/searchFiles'
import checkisBaiduAuthorized from '@/api/components/objectImporter/baidudisk/checkisBaiduAuthorized'
import getAllFilesAndFolders from '@/api/components/objectImporter/baidudisk/getAllFilesAndFolders'
import { AnimatePopover, BetterInput, Button, Content, DotLoading, Icon, IconWithPopover, WithBorder } from '@/components'
import { Icons } from '@/consts'
import loginBaidudisk from '@/api/components/objectImporter/baidudisk/loginBaidudisk'
import { DateFormat } from '@/utils'
import classnames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import produce from 'immer'
import { BaiduFile } from '~/typings'
import { useUpdate } from 'react-use'
import { useAtom } from 'jotai'
import { ImportStateAtom } from '@/api/components/objectImporter/ObjectFileUploader'
import { compareStrings } from '@/utils/str'
import ToolTip from '@/components/base/Tooltip'
import disk from '@/assets/images/baidudisk.png'

export default memo(
  ({ onlyVisibleCategory, className, singleMode }: { onlyVisibleCategory?: number; className?: string; singleMode?: boolean }) => {
    const [dirState, setDirState] = useState<
      {
        path: string
        files: BaiduFile[]
      }[]
    >([
      {
        path: '',
        files: []
      }
    ])
    const [uploaded, setUploaded] = useAtom(ImportStateAtom)
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState<{
      files: BaiduFile[]
    }>()
    const [authorized, setAuthorized] = useState<string | false>()
    const [isLoading, setIsLoading] = useState(false)
    useDebounceEffect(
      () => {
        if (search) {
          setIsLoading(true)
          searchFiles(search, onlyVisibleCategory)
            .then(res => {
              if (res) {
                if (res.list) {
                  setSearchResults({
                    files: res.list.map(i => ({ ...i, filename: i.server_filename, createdAt: i.server_ctime * 1000 }))
                  })
                }
              }
            })
            .finally(() => setIsLoading(false))
        } else {
          setSearchResults(undefined)
        }
      },
      [search],
      { wait: 500 }
    )
    useEffect(() => {
      setTimeout(() => {
        checkisBaiduAuthorized().then(res => setAuthorized(res))
      }, 500)
    }, [])
    const [searchVisible, setSearchVisible] = useState(false)
    useEffect(() => {
      if (!authorized) {
        const interval = setInterval(() => {
          checkisBaiduAuthorized().then(res => setAuthorized(res))
        }, 3000)
        return () => {
          clearInterval(interval)
        }
      }
    }, [authorized])
    useLayoutEffect(() => {
      const currentDir = dirState[dirState.length - 1]
      if (currentDir.files.length) return
      setIsLoading(true)
      getAllFilesAndFolders(currentDir.path, onlyVisibleCategory)
        .then(data => {
          if (data?.list || data?.info) {
            setDirState(currentState => {
              const index = currentState.findIndex(i => i.path === currentDir.path)
              if (index >= 0) {
                return produce(currentState, d => {
                  d[index].files = (data.list || data.info).map(i => ({
                    ...i,
                    filename: i.server_filename,
                    createdAt: i.server_ctime * 1000
                  }))
                })
              }
              return currentState
            })
          }
        })
        .finally(() => setIsLoading(false))
    }, [dirState.length, onlyVisibleCategory])
    const currentDirname = dirState.length > 1 ? dirState[dirState.length - 1].path.split('/').pop() : `${authorized}的网盘`
    const parentRef = useRef<HTMLDivElement>(null)
    const update = useUpdate()
    useLayoutEffect(() => {
      update()
    }, [dirState, searchResults])
    const handleFileClick = (i: BaiduFile) => {
      if (i.isdir) {
        setDirState(s => [
          ...s,
          {
            path: i.path,
            files: []
          }
        ])
      } else {
        if (!uploaded.baidu.some(o => o.path === i.path)) {
          setUploaded(s => ({ ...s, baidu: [i, ...s.baidu] }))
        }
      }
    }

    if (authorized === undefined) {
      return (
        <div
          style={{
            height: 400
          }}
          className={'w-full transparent-font flex items-center justify-center'}
        >
          <DotLoading />
        </div>
      )
    }
    if (authorized === false) {
      return (
        <div
          style={{
            height: 400
          }}
          className={'w-full flex flex-col items-center justify-center'}
        >
          <div
            onClick={loginBaidudisk}
            style={{
              width: 230
            }}
            className={
              'flex light-hover mt-6 rounded-xl relative justify-center transition-colors text-center p-2.5 border cursor-pointer items-center'
            }
          >
            <img src={disk} className={'size-7 mr-3'} />
            <div className={'font-medium'}>连接到网盘</div>
          </div>
          <div className={'small-transparent mt-3'}>需授权以导入文件</div>
        </div>
      )
    }
    if (dirState || searchResults) {
      return (
        <>
          <Content flex column fullWidth>
            <div ref={parentRef} className={'flex h-14 items-center justify-between px-3'}>
              <Icon
                name={'park-left'}
                size={18}
                strokeWidth={5}
                className={classnames('mr-1 ml-1 hover-active-button', dirState.length > 1 ? '' : 'hidden pointer-events-none')}
                onClick={() => {
                  if (dirState.length > 1) {
                    setDirState(dirState.slice(0, -1))
                  }
                }}
              ></Icon>
              <div
                style={{
                  maxWidth: '32rem'
                }}
                className={'font-medium mr-auto ml-2 line-clamp-1 shrink'}
              >
                {currentDirname}
              </div>
              <AnimatePresence initial={false} mode={'wait'}>
                {searchVisible ? (
                  <motion.div
                    initial={{ width: 30, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 30, opacity: 0 }}
                    key={1}
                    className={'flex overflow-hidden focus-within-input items-center bg-input gap-2 rounded-lg px-2 py-1'}
                  >
                    <Icon name={'park-search'} className={'transparent-font'} />
                    <BetterInput
                      onBlur={() => {
                        if (!search) {
                          setSearchVisible(false)
                        }
                      }}
                      autoFocus
                      placeholder={'搜索'}
                      className={'flex-1 font-size-13 overflow-hidden'}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                      <Icon
                        strokeWidth={8}
                        name={'park-close'}
                        style={{
                          padding: 3
                        }}
                        className={'shrink-0 text-white cursor-pointer rounded-full bg-neutral-400 dark:bg-neutral-600'}
                        size={7}
                        onClick={() => {
                          setSearchVisible(false)
                          setSearch('')
                        }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    transition={{ duration: 0.1 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={2}
                  >
                    <Icon onClick={() => setSearchVisible(true)} name={Icons.Search} className={'square-button'} size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
              {!singleMode && uploaded.baidu.length > 0 ? (
                <AnimatePopover
                  padding={6}
                  parentElement={parentRef.current}
                  content={
                    <WithBorder className={'min-w-72 max-w-sm'}>
                      <div className={'p-2 border-bottom'}>
                        <div className={'font-semibold font-size-13'}>已选中文件</div>
                        <div className={'font-size-12 transparent-font'}>仅支持在线预览视频，其他文件无法打开</div>
                      </div>
                      <div className={'p-1.5 overflow-y-auto max-h-96'}>
                        {uploaded.baidu.map(i => (
                          <div className={'button flex items-center justify-between group gap-8'} key={i.filename}>
                            <div className={'flex items-center gap-2'}>
                              {i.isdir ? <Icon name={Icons.Folder} /> : null}
                              <div className={'line-clamp-1 break-all font-size-13'}>{i.filename}</div>
                            </div>
                            <Icon
                              onClick={() => {
                                setUploaded(s => ({ ...s, baidu: s.baidu.filter(o => o.path !== i.path) }))
                              }}
                              className={'hover-active-button'}
                              name={Icons.Delete}
                            />
                          </div>
                        ))}
                      </div>
                    </WithBorder>
                  }
                  positions={['bottom']}
                >
                  <div
                    className={classnames(
                      'relative square-button flex items-center gap-1.5 ml-2',
                      uploaded.baidu.length && 'active-button'
                    )}
                  >
                    <Icon name={'park-file-addition-one'} size={16} />
                    {uploaded.baidu.length ? <div className={'font-size-12 leading-none'}>已选中{uploaded.baidu.length}项</div> : null}
                  </div>
                </AnimatePopover>
              ) : null}
              {!singleMode && (
                <Icon
                  size={16}
                  className={'square-button ml-2'}
                  name={'park-folder-upload'}
                  tooltip={'导入当前文件夹'}
                  onClick={() => {
                    const currentDir = dirState[dirState.length - 1].path
                    if (!uploaded.baidu.some(i => i.path === currentDir))
                      setUploaded(s => ({
                        ...s,
                        baidu: [
                          {
                            category: 0,
                            isdir: 1,
                            path: currentDir,
                            size: 0,
                            fs_id: 0,
                            createdAt: 0,
                            filename: currentDirname || 'Unnamed folder'
                          },
                          ...s.baidu
                        ]
                      }))
                  }}
                />
              )}
              <IconWithPopover
                size={16}
                className={'square-button ml-2'}
                renderOnParent={true}
                content={setV => (
                  <WithBorder className={'popover-menu-mid px-1'}>
                    <Button.IconButton
                      text={'重新登录'}
                      onClick={() => {
                        setV(false)
                        setAuthorized(false)
                        loginBaidudisk()
                      }}
                    />
                  </WithBorder>
                )}
                name={Icons.More}
                placement={['bottom']}
              ></IconWithPopover>
            </div>
            <Content style={{ height: 600, width: 760, maxHeight: 'calc(100vh - 300px)' }}>
              {isLoading && (
                <div className={'absolute transparent-font inset-0 z-[10000] flex items-center justify-center'}>
                  <DotLoading />
                </div>
              )}
              {searchResults ? (
                <div
                  className={'px-3 pb-6 absolute inset-0'}
                  style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: isLoading ? 'none' : undefined
                  }}
                >
                  {searchResults.files
                    ?.slice()
                    .sort((a, b) => {
                      if ((a.isdir && b.isdir) || (!a.isdir && !b.isdir)) return compareStrings(a.filename, b.filename)
                      if (a.isdir) return -1
                      if (b.isdir) return 1
                      return compareStrings(a.filename, b.filename)
                    })
                    .map(i => (
                      <FileItemRenderer
                        file={i}
                        key={i.fs_id}
                        onClick={() => {
                          if (i.isdir) {
                            setSearchVisible(false)
                            setSearch('')
                            setSearchResults([])
                          }
                          handleFileClick(i)
                        }}
                      />
                    ))}
                </div>
              ) : (
                <>
                  {dirState?.map((dir, idx) => (
                    <div
                      className={'px-3 pb-6 absolute inset-0'}
                      style={{
                        zIndex: idx,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        display: idx === dirState.length - 1 && !isLoading ? 'block' : 'none'
                      }}
                    >
                      {dir.files
                        ?.slice()
                        .sort((a, b) => {
                          if ((a.isdir && b.isdir) || (!a.isdir && !b.isdir)) return compareStrings(a.filename, b.filename)
                          if (a.isdir) return -1
                          if (b.isdir) return 1
                          return compareStrings(a.filename, b.filename)
                        })
                        .map(i => (
                          <FileItemRenderer
                            file={i}
                            key={i.fs_id}
                            onClick={() => {
                              handleFileClick(i)
                            }}
                          />
                        ))}
                    </div>
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
)

const FileItemRenderer = ({ file, onClick }: { file: BaiduFile; onClick: VoidFunction }) => {
  return (
    <div className={'button justify-between items-center gap-6 !py-2 flex'} onClick={onClick}>
      <div className={'flex gap-3 items-center'}>
        {file.isdir === 1 && <Icon name={Icons.Folder} />}
        {file.thumbs?.url3 && (
          <ToolTip
            disableDefaultContent
            align={'start'}
            content={<img src={file.thumbs.url3} className={'rounded-lg max-w-md max-h-96'} />}
          >
            <img className={'size-6 object-fit rounded'} src={file.thumbs.url3} />
          </ToolTip>
        )}
        <span className={'line-clamp-1 break-all'}>{file.filename}</span>
      </div>
      <div className={'font-size-11 transparent-font shrink-0'}>{DateFormat.formatTime(file.createdAt)}</div>
    </div>
  )
}
