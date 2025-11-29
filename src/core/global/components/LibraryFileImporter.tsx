import { Content, FormFooter, Modal } from '@/components'
import ObjectList, { defaultFilterSort } from '@/core/object/objectList/ObjectList'
import { memo, useRef, useState } from 'react'
import { assignProperties } from '@/utils'
import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { SidebarDatabaseCache } from '@/api/stores/keyvalue.store'

export default memo(() => {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [state, setState] = useState<SidebarDatabaseCache>(defaultFilterSort)
  const [allAvailableMetas, setMetas] = useState<number[]>()
  const promiseRef = useRef<{
    resolve: (o: MetaObject[]) => void
    reject: VoidFunction
  }>()
  const { t } = useTranslation()
  assignProperties(Global, {
    commonOps: {
      ...Global.commonOps,
      importFromLibrary: visible => {
        return new Promise((res, rej) => {
          setVisible(true)
          setMetas(visible)
          promiseRef.current = {
            reject: rej,
            resolve: res
          }
        })
      }
    }
  })
  return (
    <Modal
      visible={visible}
      onClose={() => {
        setVisible(false)
        promiseRef.current?.reject()
      }}
      zIndex={500}
    >
      <div
        className={'flex flex-col rounded-xl overflow-hidden'}
        style={{
          width: state.viewMode === 'title' ? 700 : 1140,
          height: '800px',
          overflow: 'hidden',
          maxWidth: '90vw',
          maxHeight: '80vh'
        }}
      >
        <div className={'flex items-start justify-between pt-4 pl-5 pr-4 h-14'}>
          <div className={'font-size-15 font-semibold mt-0.5'}>{t('general.Import from library')}</div>
        </div>
        <ObjectList
          onFilterSortChange={v => {
            const value = v(state)
            if (value) {
              setState(value)
            }
          }}
          visibleMetas={allAvailableMetas}
          visible
          onSelect={v => {
            setSelected(v)
          }}
          selected={selected}
        />
        <FormFooter
          onCancel={() => {
            setVisible(false)
            promiseRef.current?.reject()
          }}
          onConfirm={() => {
            setVisible(false)
            setSelected([])
            if (selected.length) {
              promiseRef.current?.resolve(selected.map(i => MetaStore.getCachedMetaObject(i)).filter(Boolean) as MetaObject[])
            }
          }}
          canConfirm={selected.length > 0}
          className={'border-top p-4'}
        />
      </div>
    </Modal>
  )
})
