import { Content, Menu } from '@/components'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import whiteboard from '@/assets/images/whiteboard.png?url'
import note from '@/assets/images/note.png?url'
import group from '@/assets/images/group.png?url'
import chrome from '@/assets/images/chrome.png?url'
import PDF from '@/assets/images/PDF.png?url'
import youtube from '@/assets/images/youtube.png?url'
import baidudisk from '@/assets/images/baidudisk.png?url'
import folder from '@/assets/images/folder.png?url'
import markdown from '@/assets/images/markdown.png?url'
import picture from '@/assets/images/picture.png?url'
import code from '@/assets/images/code.png?url'
import music from '@/assets/images/music.png?url'
import question from '@/assets/images/question.png?url'
import localfile from '@/assets/images/localfile.png?url'
import x from '@/assets/images/x.svg?raw'
import { BaidudiskInstance } from '@/api/components/fileImporter/baidudisk/BaidudiskDisplayer'
import { ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalImporterInstance } from '@/core/global/components/FileImportProcessor'
import loginBaidudisk from '@/api/components/fileImporter/baidudisk/loginBaidudisk'
import { toast } from 'react-hot-toast'
import { MetaObject } from '~/typings'
import { ObjectCreateHandler } from '@/core/global/components/ObjectCreator'
import { Utils } from 'rendevoz'
import { ReactElement, useCallback, useEffect } from 'react'
import handleImportNestedCollections from '@/api/components/fileImporter/handleImportNestedCollections'
import { Colors } from '@/consts'
import isHotkey from 'is-hotkey'
import FileSystem from '@/api/fileSystem'
import React from 'react'
import { debounce } from 'lodash'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const keyToCreateType: Record<string, string> = {
  1: 'note',
  2: 'whiteboard',
  3: 'group',
  4: 'code',
  5: 'question',
  6: 'pdf',
  7: 'webpage',
  8: 'video',
  9: 'audio',
  f1: 'image',
  f2: 'localFile',
  f3: 'tweet'
}
const debounceNotifyBaiduDisk = () => toast.success('导入成功')
const typeToKey = Object.fromEntries(Object.entries(keyToCreateType).map(i => [i[1], i[0]]))
const FileImporter = ({
  onClose,
  onCreate,
  autoOpen = true,
  type,
  createHandler,
  parentCollectionId
}: {
  onClose: VoidFunction
  onCreate?: (object: MetaObject) => void
  autoOpen: boolean
  parentCollectionId?: number
  createHandler?: (obj: MetaObject) => void
  type?: MetaObject['type']
}) => {
  const { t } = useTranslation()
  const isChinese = Utils.Navigator.getDefaultLanguage() === 'zh-CN'
  const handleAfterCreate = useCallback((one: { meta: MetaObject }) => {
    autoOpen && Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id)
    onCreate?.(one.meta)
    createHandler?.(one.meta)
  }, [])

  const handleCreate = (type: MetaObject['type']) => {
    onClose?.()
    ObjectCreateHandler[type]?.().then(handleAfterCreate)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      Object.keys(keyToCreateType).forEach(k => {
        if (isHotkey(k, e)) {
          handleCreate(keyToCreateType[k])
        }
      })
    }
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('keydown', k)
    }
  }, [])
  const records = [
    {
      name: t('general.note'),
      desc: t('general.Capture ideas with a wysiwyg editor'),
      image: note,
      type: 'note',
      onClick: () => {
        handleCreate('note')
      }
    },
    {
      name: t('general.whiteboard'),
      type: 'whiteboard',
      desc: t('general.Present your brilliant ideas on whiteboards'),
      image: whiteboard,
      onClick: () => {
        handleCreate('whiteboard')
      }
    },
    {
      name: t('general.Object group'),
      type: 'group',
      desc: t('general.Manage objects with powerful groups'),
      image: group,
      onClick: () => {
        handleCreate('group')
      }
    },
    {
      name: t('general.code'),
      type: 'code',
      image: code,
      onClick: () => {
        handleCreate('code')
      }
    },
    {
      name: t('general.question'),
      type: 'question',
      image: question,
      onClick: () => {
        handleCreate('question')
      }
    }
  ]

  const files = [
    {
      name: t('general.PDF'),
      desc: t('general.Reading PDFs and making labels'),
      image: PDF,
      type: 'pdf',
      onClick: () => {
        handleCreate('pdf')
      }
    },
    {
      name: t('general.webpage'),
      type: 'webpage',
      desc: t('general.Get distraction-free webpages with one-click'),
      image: chrome,
      onClick: () => {
        handleCreate('webpage')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('video'),
      type: 'video',
      desc: t('general.Watching and learning local or online videos'),
      image: youtube,
      onClick: () => {
        handleCreate('video')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('audio'),
      image: music,
      type: 'audio',
      onClick: () => {
        handleCreate('audio')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('image'),
      type: 'image',
      desc: t('general.Edit your image'),
      image: picture,
      onClick: () => {
        handleCreate('image')
      }
    },
    {
      name: t('general.localFile'),
      image: localfile,
      type: 'localFile',
      onClick: () => {
        handleCreate('localFile')
      }
    },
    {
      name: t('general.tweet'),
      image: <div style={{ fontSize: 22, width: 26, height: 26, paddingLeft: 2 }} dangerouslySetInnerHTML={{ __html: x }}></div>,
      type: 'tweet',
      onClick: () => {
        handleCreate('tweet')
      }
    }
  ]

  const others = [
    {
      name: t('general.Import from Markdown'),
      image: markdown,
      onClick: () => {
        onClose?.()
        Rendevoz.Actions.Utils.uploadFile({
          accept: '.md',
          multiple: true
        }).then(file => {
          const files = Array.isArray(file) ? file : [file]
          GlobalImporterInstance.import?.(files, {
            onImport: createHandler
          })
        })
      }
    },
    {
      name: t('general.Import all files from folder'),
      image: folder,
      onClick: () => {
        Rendevoz.Actions.Utils.uploadFile({
          dir: true
        }).then(files => {
          handleImportNestedCollections(files, createHandler, parentCollectionId)
        })
      }
    }
  ]
  if (isChinese) {
    others.push({
      name: t('general.Import from Baidudisk'),
      image: baidudisk,
      onClick: () => {
        onClose?.()
        if (KeyvalueStore.getOne('baiduAccessToken')) {
          toast.error('请先在网盘中授权！')
          loginBaidudisk()
          return
        }
        BaidudiskInstance.chooseFile?.(1)
        BaidudiskInstance.onCreateMeta = m => {
          createHandler?.(m)
        }
        BaidudiskInstance.onChooseFile = async file => {
          const thumb = await FileSystem.saveImage(file.thumbs.url3)
          if (file.category === 1) {
            if (file) {
              ObjectStore('video')
                .addOneWithMeta({ url: `baidudisk${file.path}` }, { currentMeta: { name: file.filename, coverImgSrc: thumb } })
                .then(o => {
                  createHandler?.(o.meta)
                  debounceNotifyBaiduDisk()
                })
            }
          }
          if (file.category === 4) {
            ObjectStore('pdf')
              .addOneWithMeta({ webFileUrl: `baidudisk/${file.fs_id}` }, { currentMeta: { name: file.filename, coverImgSrc: thumb } })
              .then(o => {
                createHandler?.(o.meta)
                debounceNotifyBaiduDisk()
              })
          }
        }
      }
    })
  }
  const renderer = (
    details: { name: string; image: string | ReactElement; type: string },
    opts: {
      isSelected: boolean
      onPointerMove: VoidFunction
      onClick: VoidFunction
    }
  ) => {
    return (
      <Content
        flex
        gap={12}
        style={{ width: '100%', background: opts.isSelected ? Colors.Background.ButtonHover : undefined }}
        alignItems={'center'}
        onPointerMove={opts.onPointerMove}
        className={ClassName.flatButton(4, '4px 8px')}
        onClick={opts.onClick}
      >
        <div
          style={{
            borderRadius: 4,
            padding: '4px 4px'
          }}
        >
          {React.isValidElement(details.image) ? (
            details.image
          ) : (
            <img
              src={details.image}
              style={{
                width: 26,
                height: 26,
                objectFit: 'cover'
              }}
            />
          )}
        </div>
        <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>
          <div>{details.name}</div>
          {typeToKey[details.type] ? (
            <div
              style={{
                textTransform: 'uppercase'
              }}
              className={'font-size-12 transparent-font'}
            >
              {typeToKey[details.type]}
            </div>
          ) : undefined}
        </Content>
      </Content>
    )
  }
  return (
    <Content flex column style={{ maxWidth: '90vw', maxHeight: 'min(800px, 80vh)', padding: 24, overflowY: 'auto' }}>
      <div style={{ paddingLeft: 8, marginBottom: 18 }} className={ClassName.title('20px')}>
        {t('general.Create new object')}
      </div>
      <Menu.NavigationMenu
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12
        }}
        layout={[
          {
            type: 'column',
            style: {
              minWidth: 240,
              flex: 'auto'
            },
            children: [
              {
                type: 'title',
                name: t('general.Organize your ideas')
              },
              ...records.map(r => ({
                type: 'custom',
                children: options => renderer(r, options),
                key: r.name,
                onSelect: () => r.onClick()
              }))
            ]
          },
          {
            type: 'column',
            style: {
              minWidth: 240,
              flex: 'auto'
            },
            children: [
              {
                type: 'title',
                name: t('general.Learning new things')
              },
              ...files.map(r => ({
                type: 'custom',
                children: options => renderer(r, options),
                key: r.name,
                onSelect: () => r.onClick()
              }))
            ]
          },
          {
            type: 'column',
            style: {
              minWidth: 240,
              flex: 'auto'
            },
            children: [
              {
                type: 'title',
                name: t('general.Others')
              },
              ...others.map(r => ({
                type: 'custom',
                children: options => renderer(r, options),
                key: r.name,
                onSelect: () => r.onClick()
              }))
            ]
          }
        ]}
      />
    </Content>
  )
}

export default FileImporter
