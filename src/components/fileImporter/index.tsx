import { Content } from '@/components'
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
import { useState } from 'react'
import { assignProperties, fetchRemoteImageAndSaveLocally } from '@/utils'
import { BaidudiskInstance } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'
import { ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalImporterInstance } from '@/core/global/GlobalImporter'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'
import { toast } from 'react-hot-toast'
import { useSetting } from '@/core'
import { MetaObject } from '~/typings'
import { ObjectCreateHandler } from '@/core/global/GlobalObjectCreator'

export const GlobalFileImporterInstance = {}
const FileImporter = ({
  onClose,
  onCreate,
  autoOpen = true,
  type
}: {
  onClose: VoidFunction
  onCreate?: (object: MetaObject) => void
  autoOpen: boolean
  type?: MetaObject['type']
}) => {
  const { t } = useTranslation()
  const [visible, toggleVisible] = useState(false)
  const isChinese = useSetting()[0].general.language === 'zh-CN'

  const handleAfterCreate = (one: { meta: MetaObject }) => {
    autoOpen && Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id)
    onCreate?.(one.meta)
  }
  assignProperties(GlobalFileImporterInstance, {
    open: () => toggleVisible(true),
    close: () => toggleVisible(false)
  })

  const handleCreate = (type: MetaObject['type']) => {
    onClose?.()
    ObjectCreateHandler[type]?.().then(handleAfterCreate)
  }
  const records = [
    {
      name: t('general.note'),
      desc: t('general.Capture ideas with a wysiwyg editor'),
      image: note,
      onClick: () => {
        handleCreate('note')
      }
    },
    {
      name: t('general.whiteboard'),
      desc: t('general.Present your brilliant ideas on whiteboards'),
      image: whiteboard,
      onClick: () => {
        handleCreate('whiteboard')
      }
    },
    {
      name: t('general.Object group'),
      desc: t('general.Manage objects with powerful groups'),
      image: group,
      onClick: () => {
        handleCreate('group')
      }
    },
    {
      name: t('general.code'),
      image: code,
      onClick: () => {
        handleCreate('code')
      }
    },
    {
      name: t('general.question'),
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
      onClick: () => {
        handleCreate('pdf')
      }
    },
    {
      name: t('general.webpage'),
      desc: t('general.Get distraction-free webpages with one-click'),
      image: chrome,
      onClick: () => {
        handleCreate('webpage')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('video'),
      desc: t('general.Watching and learning local or online videos'),
      image: youtube,
      onClick: () => {
        handleCreate('video')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('audio'),
      image: music,
      onClick: () => {
        handleCreate('audio')
      }
    },
    {
      name: Rendevoz.Utils.Meta.getTypeName('image'),
      desc: t('general.Edit your image'),
      image: picture,
      onClick: () => {
        handleCreate('image')
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
          GlobalImporterInstance.import?.(files)
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
          const dirname = files[0].webkitRelativePath.split('/')[0]
          GlobalImporterInstance.import?.(files, { isDir: true, dirName: dirname })
        })
      }
    }
  ]
  if (isChinese) {
    others.push({
      name: t('general.Import from Baidudisk'),
      desc: t('general.Import from Baidudisk'),
      image: baidudisk,
      onClick: () => {
        if (!localStorage.getItem('bda')) {
          toast.error('请先在网盘中授权！')
          loginBaidudisk()
          return
        }
        BaidudiskInstance.chooseFile?.(1)
        BaidudiskInstance.onChooseFile = async file => {
          const thumb = await fetchRemoteImageAndSaveLocally(file.thumbs.url3)
          if (file.category === 1) {
            if (file) {
              ObjectStore('video')
                .addOneWithMeta({ videoUrl: `baidudisk${file.path}` }, { currentMeta: { name: file.filename, coverImgSrc: thumb } })
                .then(handleAfterCreate)
            }
          }
          if (file.category === 4) {
            ObjectStore('pdf')
              .addOneWithMeta({ webFileUrl: `baidudisk/${file.fs_id}` }, { currentMeta: { name: file.filename, coverImgSrc: thumb } })
              .then(handleAfterCreate)
          }
        }
      }
    })
  }
  const renderer = (details: { name: string; desc: string; image: string; onClick?: VoidFunction }) => {
    return (
      <Content
        flex
        gap={12}
        style={{ width: '100%' }}
        alignItems={'center'}
        className={ClassName.flatButton(4, '4px 8px')}
        onClick={details.onClick}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 4,
            padding: '4px 4px'
          }}
        >
          <img
            src={details.image}
            style={{
              width: 26,
              height: 26,
              objectFit: 'cover'
            }}
          />
        </div>
        <Content style={{ fontSize: 15, fontWeight: 500 }}>
          <div>{details.name}</div>
          {/*<div style={{ marginTop: 4 }} className={ClassName.description(FontSize['12px'])}>*/}
          {/*  {details.desc}*/}
          {/*</div>*/}
        </Content>
      </Content>
    )
  }
  return (
    <Content flex column style={{ width: `min(620px, 90vw)`, maxHeight: 'min(800px, 80vh)', padding: 16, overflowY: 'auto' }}>
      <div style={{ paddingLeft: 8, marginBottom: 8 }} className={ClassName.title('20px')}>
        {t('general.Create new object')}
      </div>
      <div style={{ paddingLeft: 8, margin: '8px 0px' }} className={ClassName.title('1rem')}>
        {t('general.Organize your ideas')}
      </div>
      <Content>{records.map(r => renderer(r))}</Content>
      <div style={{ paddingLeft: 8, margin: '8px 0px' }} className={ClassName.title('1rem')}>
        {t('general.Learning new things')}
      </div>
      <Content>{files.map(f => renderer(f))}</Content>
      <div style={{ paddingLeft: 8, margin: '8px 0px' }} className={ClassName.title('1rem')}>
        {t('general.Others')}
      </div>
      <Content>{others.map(o => renderer(o))}</Content>
    </Content>
  )
}

export default FileImporter
