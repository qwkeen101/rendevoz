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

import { Colors } from '@/consts'
import FontSize from '@/consts/font'
import { useState } from 'react'
import { assignProperties, fetchRemoteImageAndSaveLocally } from '@/utils'
import { BaidudiskInstance } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'
import { ObjectStore } from '@/stores'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalImporterInstance } from '@/core/global/GlobalImporter'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'
import { toast } from 'react-hot-toast'
import { useSetting } from '@/core'

export const GlobalFileImporterInstance = {}
const FileImporter = ({ onClose }: { onClose: VoidFunction }) => {
  const { t } = useTranslation()
  const [visible, toggleVisible] = useState(false)
  const isChinese = useSetting()[0].general.language === 'zh-CN'
  assignProperties(GlobalFileImporterInstance, {
    open: () => toggleVisible(true),
    close: () => toggleVisible(false)
  })
  const records = [
    {
      name: t('general.note'),
      desc: t('general.Capture ideas with a wysiwyg editor'),
      image: note,
      onClick: () => {
        onClose?.()
        ObjectStore('note')
          .addOneWithMeta({})
          .then(one => Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id))
      }
    },
    {
      name: t('general.whiteboard'),
      desc: t('general.Present your brilliant ideas on whiteboards'),
      image: whiteboard,
      onClick: () => {
        ObjectStore('whiteboard')
          .addOneWithMeta({})
          .then(one => Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id))
        onClose?.()
      }
    },
    {
      name: t('general.Object group'),
      desc: t('general.Manage objects with powerful groups'),
      image: group,
      onClick: () => toast.error('Not available right now!')
    }
  ]

  const files = [
    {
      name: t('general.PDF'),
      desc: t('general.Reading PDFs and making labels'),
      image: PDF,
      onClick: () => {
        ObjectStore('pdf')
          .addOneWithMeta(
            {},
            {
              currentMeta: {
                name: 'Unnamed PDF'
              },
              showMetaModal: true
            }
          )
          .then(one => Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id))
        onClose?.()
      }
    },
    {
      name: t('general.video'),
      desc: t('general.Watching and learning local or online videos'),
      image: youtube,
      onClick: () => {
        ObjectStore('video')
          .addOneWithMeta(
            {},
            {
              currentMeta: {
                name: 'Unnamed video'
              },
              showMetaModal: true
            }
          )
          .then(one => Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id))
        onClose?.()
      }
    },
    {
      name: t('general.webpage'),
      desc: t('general.Get distraction-free webpages with one-click'),
      image: chrome,
      onClick: () => {
        ObjectStore('webpage')
          .addOneWithMeta(
            {},
            {
              currentMeta: {
                name: 'Unnamed webpage'
              },
              showMetaModal: true
            }
          )
          .then(one => Rendevoz.Actions.Open.Meta.openMetaObject(one.meta.id))
        onClose?.()
      }
    }
  ]

  const others = [
    {
      name: t('general.Markdown'),
      desc: t('general.Import from Markdown'),
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
      name: t('general.Folder'),
      desc: t('general.Import all files from folder'),
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
      name: t('general.Baidudisk'),
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
              ObjectStore('video').addOneWithMeta(
                { videoUrl: `baidudisk${file.path}` },
                { currentMeta: { name: file.filename, coverImgSrc: thumb } }
              )
            }
          }
          if (file.category === 4) {
            ObjectStore('pdf').addOneWithMeta(
              { webFileUrl: `baidudisk/${file.fs_id}` },
              { currentMeta: { name: file.filename, coverImgSrc: thumb } }
            )
          }
        }
      }
    })
  }
  const renderer = (details: { name: string; desc: string; image: string; onClick?: VoidFunction }) => {
    return (
      <Content flex gap={16} alignItems={'center'} className={ClassName.flatButton(6, '8px 12px')} onClick={details.onClick}>
        <div
          style={{
            background: 'white',
            borderRadius: 4,
            padding: 6
          }}
        >
          <img
            src={details.image}
            style={{
              width: 40,
              height: 40,
              objectFit: 'cover'
            }}
          />
        </div>
        <Content style={{ lineHeight: 1.1, fontWeight: 500 }}>
          <div>{details.name}</div>
          <div style={{ marginTop: 4 }} className={ClassName.description(FontSize['12px'])}>
            {details.desc}
          </div>
        </Content>
      </Content>
    )
  }
  return (
    <Content flex column style={{ maxWidth: `min(960px, 60vw)`, maxHeight: 'min(800px, 80vh)', overflowY: 'auto' }} gap={12}>
      <div style={{ paddingLeft: 8, marginBottom: 20 }} className={ClassName.title('20px')}>
        {t('general.Create new object')}
      </div>
      <div style={{ paddingLeft: 8 }} className={ClassName.title()}>
        {t('general.Organize your ideas')}
      </div>
      <Content flex gap={24} style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {records.map(r => renderer(r))}
      </Content>
      <div style={{ paddingLeft: 8 }} className={ClassName.title()}>
        {t('general.Learning new things')}
      </div>
      <Content flex gap={24} style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {files.map(f => renderer(f))}
      </Content>
      <div style={{ paddingLeft: 8 }} className={ClassName.title()}>
        {t('general.Others')}
      </div>
      <Content flex gap={24} style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {others.map(o => renderer(o))}
      </Content>
    </Content>
  )
}

export default FileImporter
