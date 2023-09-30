import { Button, Content, Modal } from '@/components'
import { useState } from 'react'
import useVideoState from '@/core/video/hooks/useVideoState'
import Select from '@/components/base/select'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import requestVideoSubtitle from '@/components/fileImporter/baidudisk/requestVideoSubtitle'
import toWebVTT from 'srt-webvtt'
import { saveBlobLocally, saveFileLocally } from '@/utils'
import Id from '@/utils/id'
import { ObjectStore } from '@/stores'
import { toast } from 'react-hot-toast'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { Colors } from '@/consts'

type Props = {
  visible: boolean
  onChange: VoidFunction
}
const defaultSubtitleInfo = {
  lang: 'default',
  url: undefined
}

const languageLists = ['English', '简体中文', '繁體中文', '日本語', 'Español', 'français', 'Deutsch']

export const parseSubtitleInfo = async (info: string) => {
  const lines = info.split(/[\r\n]/)
  if (lines[1] === '#MEDIA:SUBTITLES') {
    lines.shift()
    lines.shift()
    const subtitles = []
    lines.forEach((l, index, array) => {
      if (l.startsWith('#EXT-X-MEDIA')) {
        const downloadlink = array[index + 1]
        const lang = l
          .split(',')
          .find(i => i.startsWith('LANGUAGE'))
          .split('=')[1]
          .replaceAll('"', '')
        subtitles.push({
          lang,
          url: downloadlink
        })
      }
    })
    const result = await Promise.all(
      subtitles.map(async i => {
        const file = await (await fetch(i.url)).blob()
        const vttFileUrl = await toWebVTT(file)
        const blob = await (await fetch(vttFileUrl)).blob()
        const result = await saveBlobLocally(blob, `subtitles_${Id.getId()}`)
        return {
          lang: i.lang,
          url: result
        }
      })
    )
    return result
  }
}
const VideoSubtitleImporter = ({ visible, onChange }: Props) => {
  const [videoState] = useVideoState()
  const { t } = useTranslation()
  const isBaidu = videoState.url?.startsWith('baidudisk')
  const [subtitleInfo, setSubtitleInfo] = useState(defaultSubtitleInfo)
  const [isImportingBaidu, setIsImportingBaidu] = useState(false)
  const handleImportSubtitle = async () => {
    const file = (await Rendevoz.Actions.Utils.uploadFile()) as File
    if (file) {
      if (file.name.endsWith('srt')) {
        const vttFileUrl = await toWebVTT(file)
        const blob = await (await fetch(vttFileUrl)).blob()
        const filepath = await saveBlobLocally(blob, `subtitles_${Id.getId()}`)
        console.log(filepath)
        if (filepath) {
          await ObjectStore('video').updateOne({
            id: videoState.videoId,
            subtitleList: [
              ...(videoState.subtitleList || []),
              {
                lang: subtitleInfo.lang,
                url: filepath
              }
            ]
          })
          toast.success('导入成功！')
          onChange()
        }
      }
      if (file.name.endsWith('vtt')) {
        const path = (await saveFileLocally(file.path, file.name)).data
        await ObjectStore('video').updateOne({
          id: videoState.videoId,
          subtitleList: [
            ...(videoState.subtitleList || []),
            {
              lang: subtitleInfo.lang,
              url: path
            }
          ]
        })
        toast.success('导入成功！')
        onChange()
        return
      }
    }
  }
  return (
    <Modal visible={visible} onClose={onChange}>
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
        <div className={ClassName.title(FontSize['18px'])}>{t('general.import subtitles')}</div>
        <Content flex justifyContent="space-between">
          <div>{t('general.Choose language')}</div>
          <Select
            closeOnSelect={true}
            placeholder={t('general.default')}
            onSelect={v => {
              setSubtitleInfo(s => ({ ...s, lang: v[0] }))
            }}
            options={languageLists.map(i => ({ value: i, children: i }))}
          />
        </Content>
        <Button.IconButton
          style={{
            border: `1px solid ${Colors.Background.Border}`
          }}
          text={t('general.import local subtitle file')}
          icon={'park-upload'}
          onClick={handleImportSubtitle}
        />
        {isBaidu && (
          <Button.IconButton
            spin={isImportingBaidu}
            style={{
              border: `1px solid ${Colors.Background.Border}`
            }}
            icon={isImportingBaidu ? 'park-loading-four' : 'park-upload'}
            text={'导入网盘字幕(需要会员)'}
            onClick={async () => {
              setIsImportingBaidu(true)
              try {
                const path = videoState.url?.replace('baidudisk', '')
                const result = await requestVideoSubtitle(path)
                const parsed = await parseSubtitleInfo(result)
                if (parsed.length) {
                  await ObjectStore('video').updateOne({
                    id: videoState.videoId,
                    subtitleList: [...(videoState.subtitleList || []), ...parsed]
                  })
                  toast.success('导入成功！')
                  onChange()
                } else {
                  toast.error('不存在字幕文件！')
                }
              } finally {
                setIsImportingBaidu(false)
              }
            }}
          ></Button.IconButton>
        )}
      </div>
    </Modal>
  )
}

export default VideoSubtitleImporter
