import { ISettingItem } from '@/core/setting/SettingItem'
import { GlobalSetting } from '@/core'
import { Button, Modal } from '@/components'
import Id from '@/utils/id'
import fileSystem from '@/api/fileSystem'
import { getFilenameWithoutExtension } from '@/utils'
import { useState } from 'react'
import { Icons } from '@/consts'

export default () => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  const [visible, setVisible] = useState(false)
  const renderFontManager = () => {
    return (
      <Modal
        visible={visible}
        onClose={() => {
          setVisible(false)
        }}
      >
        <div className={'p-6 w-[90vw] max-w-lg'}>
          <div className={'flex justify-between'}>
            <div className={'font-bold text-2xl'}>自定义字体</div>
            <Button.IconButton
              text={'导入'}
              icon={Icons.Create}
              onClick={() => {
                Global.commonOps?.upload().then(file => {
                  if (file instanceof File) {
                    fileSystem.fs.writeFile(file, file.name).then(res => {
                      setSetting(s => ({
                        ...s,
                        general: {
                          ...s.general,
                          importedFonts: [
                            {
                              id: Id.getId(),
                              name: getFilenameWithoutExtension(file.name),
                              path: res,
                              selected: false
                            },
                            ...(s.general.importedFonts || [])
                          ]
                        }
                      }))
                    })
                  }
                })
              }}
            />
          </div>
          {setting.general.importedFonts?.map(i => <div>{i.name}</div>)}
        </div>
      </Modal>
    )
  }
  const item: ISettingItem = {
    title: '自定义字体',
    children: <Button.IconButton text={'管理'} onClick={() => setVisible(true)} />
  }
  return { item, renderFontManager }
}
