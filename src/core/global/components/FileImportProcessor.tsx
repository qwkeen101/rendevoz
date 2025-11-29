import { assignProperties, noRepeatArray } from '@/utils'
import { loopProcess } from '@/utils/functions'
import Id from '@/utils/id'
import { memo, useMemo, useState } from 'react'
import { CollectionStore, ObjectStore } from '@/api/stores'
import { createPortal } from 'react-dom'
import { Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import importBaidu from '@/api/components/objectImporter/baidudisk/importBaidu'
import produce from 'immer'
import classnames from 'classnames'
import { Icons } from '@/consts'

export default memo(() => {
  const { t } = useTranslation()
  const [items, setItems] = useState<
    {
      id: number | string
      name: string
      metaId?: number
      collectionId?: number
      progress?: number
      fail?: boolean
      isDir?: boolean
    }[]
  >([])

  const [visible, setVisible] = useState(false)
  assignProperties(Global, {
    commonOps: {
      ...Global.commonOps,
      importURLs: async (urls, opts) => {
        setVisible(true)
        const urlArr = noRepeatArray(Array.isArray(urls) ? urls : [urls])
        const metas: number[] = []
        setItems(n => [
          ...urlArr.map(url => ({
            id: url,
            name: url,
            progress: 0
          })),
          ...n
        ])
        return new Promise(res => {
          loopProcess(
            urlArr,
            async url => {
              try {
                const res = await Global.utils.normalizeURL(url)
                const { meta } = await ObjectStore(res.meta.type).addOneWithMeta(
                  {
                    ...res.object
                  },
                  {
                    currentMeta: {
                      ...res.meta
                    }
                  }
                )
                opts?.onImport?.(meta)
                metas.push(meta.id)
                setItems(s =>
                  produce(s, draft => {
                    const item = draft.find(i => i.id === url)
                    if (item) {
                      item.progress = 1
                      item.metaId = meta.id
                      item.name = meta.name || item.name
                    }
                  })
                )
              } catch (e) {
                setItems(s =>
                  produce(s, draft => {
                    const item = draft.find(i => i.id === url)
                    if (item) {
                      item.fail = true
                    }
                  })
                )
                return Promise.resolve()
              }
            },
            {
              onEnd: () => {
                res()
                if (opts?.parentCollectionId) {
                  CollectionStore.addItemToCollection(
                    metas.map(m => ({ type: 'meta', id: m })),
                    opts.parentCollectionId
                  )
                }
              }
            }
          )
        })
      },
      importBaidu: (file, opts) => {
        setVisible(true)
        const fileArr = Array.isArray(file) ? file : [file]
        importBaidu(fileArr.reverse(), {
          ...opts,
          onImport: (m, isNested) => {
            opts?.onImport?.(m)
            if (isNested === false) {
              setItems(s =>
                produce(s, draft => {
                  draft.unshift({
                    name: m.name || '',
                    metaId: m.id,
                    progress: 1,
                    id: m.id
                  })
                })
              )
            }
          },
          onFolderProgress: res => {
            setItems(s =>
              produce(s, draft => {
                const dir = draft.find(i => i.id === res.id)
                if (!dir) {
                  draft.unshift({
                    name: res.name,
                    progress: res.progress,
                    collectionId: res.collectionId,
                    id: res.id,
                    isDir: true
                  })
                } else {
                  dir.collectionId = res.collectionId
                  dir.progress = res.progress
                  dir.name = res.name
                  dir.isDir = true
                }
              })
            )
          }
        })
      },
      importFolder: async (folder, opts) => {
        const folders = Array.isArray(folder) ? folder : [folder]
        await Promise.allSettled(
          folders.map(async folder => {
            return await new Promise(res => {
              Global.commonOps?.importFiles?.(folder.files, {
                isDir: true,
                dirName: folder.name,
                onImport: opts?.onImport,
                parentCollectionId: opts?.parentCollectionId ?? 0,
                onEnd: async result => {
                  if (result?.collectionId) {
                    await Promise.allSettled(
                      folder.folders.map(async f => {
                        await Global.commonOps?.importFolder?.(f, {
                          ...opts,
                          parentCollectionId: result.collectionId
                        })
                      })
                    )
                  }
                  res(null)
                }
              })
            })
          })
        )
      },
      importFiles: (files, opts) => {
        setVisible(true)
        const arrFiles = (Array.isArray(files) ? files : [files]) as (File & {
          id: number
        })[]
        arrFiles.forEach(file => Object.assign(file, { id: Id.getId() }))
        const dirId = Id.getId()
        if (opts?.isDir) {
          setItems(n => [
            {
              id: dirId,
              isDir: true,
              name: opts.dirName || 'Unnamed folder',
              progress: 0
            },
            ...n
          ])
        } else {
          setItems(n => [
            ...arrFiles.map(file => ({
              id: file.id,
              name: file.name,
              progress: 0
            })),
            ...n
          ])
        }
        const groupedDir: number[] = []
        return new Promise(res => {
          loopProcess(
            arrFiles,
            async file => {
              try {
                const res = await Global.utils.normalizeFile(file)
                if (res) {
                  const result = (await ObjectStore(res.meta.type).addOneWithMeta(res.object, { currentMeta: res.meta })).meta
                  if (!result) throw ''
                  opts?.onImport?.(result)
                  groupedDir.push(result.id)
                  if (opts?.isDir) {
                    setItems(s =>
                      produce(s, draft => {
                        const dir = draft.find(i => i.id === dirId)
                        if (dir) {
                          dir.progress = groupedDir.length / arrFiles.length
                        }
                      })
                    )
                  } else {
                    setItems(s =>
                      produce(s, draft => {
                        const item = draft.find(i => i.id === file.id)
                        if (item) {
                          item.progress = 1
                          item.metaId = result.id
                        }
                      })
                    )
                  }
                  return
                }
                throw ''
              } catch (e) {
                if (!opts?.isDir) {
                  setItems(s =>
                    produce(s, draft => {
                      const item = draft.find(i => i.id === file.id)
                      if (item) {
                        item.fail = true
                      }
                    })
                  )
                }
                return Promise.resolve()
              }
            },
            {
              onEnd: () => {
                res()
                if (opts?.isDir) {
                  CollectionStore.addCollection({
                    name: opts?.dirName,
                    parentId: opts?.parentCollectionId || 0,
                    items: groupedDir.map(i => ({ type: 'meta', id: i }))
                  }).then(id => {
                    setItems(s =>
                      produce(s, draft => {
                        const dir = draft.find(i => i.id === dirId)
                        if (dir) {
                          dir.collectionId = id.id
                        }
                      })
                    )
                    if (opts?.parentCollectionId) {
                      CollectionStore.addItemToCollection({ id: id.id, type: 'collection' }, opts.parentCollectionId)
                    }
                    opts?.onEnd?.({ collectionId: id.id })
                  })
                }
              }
            }
          )
        })
      }
    }
  })

  const { success, fail } = useMemo(() => {
    const success = items.filter(i => i.progress === 1).length
    const fail = items.filter(i => i.fail).length
    return { success, fail }
  }, [items])
  const completed = success + fail === items.length
  return createPortal(
    visible ? (
      <WithBorder
        className={'fixed'}
        style={{
          zIndex: 100,
          bottom: 24,
          right: 24,
          width: 400
        }}
      >
        <div className={'p-3 border-bottom flex flex-col gap-1'}>
          <div className={'items-center flex justify-between'}>
            <div className={'font-semibold'}>{completed ? t('general.import completed') : t('general.importing')}</div>
            <Icon name={Icons.Close} size={16} className={'hover-active-button'} strokeWidth={4} onClick={() => setVisible(false)} />
          </div>
          {items.length ? (
            <div className={'font-size-12 transparent-font'}>
              {t('general.import details', {
                total: items.length,
                success,
                fail
              })}
            </div>
          ) : null}
        </div>
        <div className={'max-h-80 overflow-y-auto p-1'}>
          {items.map(i => {
            const loading = i.progress !== 1 && !i.fail
            const finished = i.progress === 1 && !i.fail
            return (
              <div
                key={i.id}
                onClick={() => {
                  console.log(i)
                  if (i.isDir) {
                    if (i.collectionId) {
                      Global.layoutOps?.openPage('collectionGroup', { id: i.collectionId })
                    }
                  } else {
                    if (i.metaId) {
                      Global.layoutOps?.openObject(i.metaId)
                    }
                  }
                }}
                className={'button items-center flex gap-3'}
              >
                {i.isDir && <Icon name={Icons.Folder} />}
                <div className={'line-clamp-1 break-all font-size-13'}>{i.name}</div>
                <Icon
                  className={classnames('ml-auto', i.fail ? 'text-red-500' : loading ? undefined : 'text-green-500')}
                  spin={loading}
                  name={finished ? 'park-check' : i.fail ? 'park-close' : Icons.Loading}
                />
              </div>
            )
          })}
        </div>
      </WithBorder>
    ) : null,
    document.body
  )
})
