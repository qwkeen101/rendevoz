import { BetterInput, Modal, Select } from '@/components'
import { useTranslation } from 'react-i18next'
import { useLayoutEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import fileSystem from '@/api/fileSystem'
import BaidudiskImporter from '@/api/components/objectImporter/baidudisk/BaidudiskImporter'
import { createStore, Provider, useAtom } from 'jotai'
import { ImportStateAtom } from '@/api/components/objectImporter/ObjectFileUploader'

const FormFilePathPicker = ({
  onChange,
  value,
  enable,
  accept
}: {
  onChange?: (path: string | undefined) => void
  value?: string
  enable?: {
    local?: boolean
    web?: boolean
    baidu?: boolean
    baiduCategory?: number
  }
  accept?: string
}) => {
  const { t, i18n } = useTranslation()
  const [chooser, setChooser] = useState<'web' | 'local' | 'baidudisk'>('local')
  const [baiduVisible, setBaiduVisible] = useState(false)
  const store = useMemo(() => createStore(), [])
  const [{ baidu }, setImporter] = useAtom(ImportStateAtom, { store })
  const selectOptions = []
  if (enable?.local) {
    selectOptions.push({
      value: 'local',
      children: t('general.Local file')
    })
  }
  if (enable?.web) {
    selectOptions.push({
      value: 'web',
      children: t('general.Web file')
    })
  }
  if (enable?.baidu && i18n.language === 'zh-CN') {
    selectOptions.push({
      value: 'baidudisk',
      children: t('general.Baidudisk file')
    })
  }
  useLayoutEffect(() => {
    if (baidu.length) {
      onChange?.(`baidudisk${baidu[0].path}`)
      setImporter(s => ({ ...s, baidu: [] }))
      setBaiduVisible(false)
    }
  }, [baidu.length])
  useLayoutEffect(() => {
    if (selectOptions.length === 1) {
      setChooser(selectOptions[0].value)
      return
    }
    if (value?.startsWith('http')) {
      setChooser('web')
    }
    if (value?.startsWith('baidudisk')) {
      setChooser('baidudisk')
    }
  }, [])
  return (
    <div>
      <Modal
        style={{
          minWidth: 500
        }}
        visible={baiduVisible}
        onClose={() => setBaiduVisible(false)}
      >
        <Provider store={store}>
          <BaidudiskImporter singleMode onlyVisibleCategory={enable?.baiduCategory} />
        </Provider>
      </Modal>
      <div className={'font-size-12 transparent-font mb-2'}>{t('general.File path')}</div>
      <div
        className={classnames(
          'flex items-center pr-1 pl-3 py-1 h-10 rounded-lg bg-input focus-within-input',
          (chooser === 'baidudisk' || chooser === 'local') && 'cursor-pointer'
        )}
        onClick={() => {
          if (chooser === 'baidudisk') {
            setBaiduVisible(true)
          }
          if (chooser === 'local') {
            Global.commonOps
              ?.upload({
                accept
              })
              .then(i => {
                if (i instanceof File) {
                  fileSystem.saveFile(i).then(i => onChange?.(i))
                }
              })
          }
        }}
      >
        <BetterInput
          style={{
            pointerEvents: chooser === 'web' ? 'auto' : 'none'
          }}
          placeholder={chooser === 'web' ? t('general.Type URL') : t('general.Select one file')}
          value={chooser === 'web' ? value : Global.utils.formatURL(value || '')}
          className={'flex-1 font-size-12'}
        />
        {selectOptions.length > 1 && (
          <div onClick={e => e.stopPropagation()}>
            <Select
              className={'font-size-12 transparent-font'}
              onSelect={v => {
                setChooser(v[0])
              }}
              options={selectOptions}
              value={chooser}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FormFilePathPicker
