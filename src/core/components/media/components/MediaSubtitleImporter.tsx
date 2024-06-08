import { Button, Content, Modal } from '@/components'
import { useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import Select from '@/components/base/select'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import toWebVTT from 'srt-webvtt'
import Id from '@/utils/id'
import { toast } from 'react-hot-toast'
import { Colors } from '@/consts'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import FileSystem from '@/api/fileSystem'

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
        const result = await FileSystem.fs.writeFile(blob, `/files/subtitles_${Id.getId()}`)
        return {
          lang: i.lang,
          url: result
        }
      })
    )
    return result
  }
}

const MediaSubtitleImporter = ({ visible, onChange }: Props) => {
  const [mediaState] = useMediaState()
  const { t } = useTranslation()
  const [subtitleInfo, setSubtitleInfo] = useState(defaultSubtitleInfo)
  const instance = useMediaInstance()
  const handleImportSubtitle = async () => {
    const file = (await Rendevoz.Actions.Utils.uploadFile()) as File
    if (file) {
      if (file.name.endsWith('srt')) {
        const vttFileUrl = await toWebVTT(file)
        const blob = await (await fetch(vttFileUrl)).blob()
        const filepath = await FileSystem.fs.writeFile(blob, `/files/subtitles_${Id.getId()}`)
        console.log(filepath)
        if (filepath) {
          instance.on?.({
            type: 'subtitleUpdated',
            subtitleList: [
              ...(mediaState.subtitleList || []),
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
        const path = await FileSystem.copyFile(file.path, file.name)
        instance.on?.({
          type: 'subtitleUpdated',
          subtitleList: [
            ...(mediaState.subtitleList || []),
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
        <div className={'font-size-16 bold-font'}>{t('general.import subtitles')}</div>
        <Content flex justifyContent="space-between" alignItems={'center'}>
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
          className={'border'}
          text={t('general.import local subtitle file')}
          icon={'park-upload'}
          onClick={handleImportSubtitle}
        />
      </div>
    </Modal>
  )
}

export default MediaSubtitleImporter
