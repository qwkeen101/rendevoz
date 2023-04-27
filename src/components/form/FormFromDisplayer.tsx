import { useEffect, useState } from 'react'
import { MetaObject } from '~/typings'
import { groupClassName, hoverLabelClassName } from './useFlipForm'
import { useTranslation } from 'react-i18next'
import { IconNameItem } from '../layout/sidebar/SidebarCollection'
import { MetaStore, ObjectStore } from '@/stores'
import { getIcon } from '../layout/sidebar/items/SidebarObjectItem'

const FormFromDisplayer = ({ initialObject }: { initialObject: Partial<MetaObject> }) => {
  const [fromState, setFromState] = useState<{
    name?: string
    icon?: string
  }>()
  const { t } = useTranslation()
  useEffect(() => {
    const setAction = async () => {
      if (initialObject.type && initialObject.objectId) {
        switch (initialObject.type) {
          case 'image': {
            const one = await ObjectStore(initialObject.type).getOneById(initialObject.objectId)
            if (one && one.from) {
              const { from } = one
              switch (from.type) {
                case 'pdf': {
                  const { pdfId, pages } = from
                  if (pdfId) {
                    const pdfMeta = MetaStore.getMetaObjectByObjectId(pdfId)
                    const renderPages = pages && (pages.length > 1 ? `${pages[0] + 1}-${pages.pop()! + 1}` : `${pages[0]}`)
                    if (pdfMeta) {
                      setFromState({
                        name: `${pdfMeta.name}${pages ? ' ' + t('general.page') + ': ' + renderPages : ''}`,
                        icon: pdfMeta.icon || getIcon('pdf')
                      })
                    }
                  }
                  break
                }
                case 'note': {
                  const { noteId } = from
                  const noteMeta = MetaStore.getMetaObjectByObjectId(noteId)
                  if (noteMeta) {
                    setFromState({
                      name: noteMeta.name,
                      icon: noteMeta.icon || getIcon('note')
                    })
                  }
                  break
                }
              }
            }
            break
          }
          case 'noteBlock':
          case 'noteLabel': {
            const one = await ObjectStore(initialObject.type).getOneById(initialObject.objectId)
            if (one) {
              const { noteId } = one
              const noteMeta = MetaStore.getMetaObjectByObjectId(noteId)
              if (noteMeta) {
                setFromState({
                  name: noteMeta.name,
                  icon: noteMeta.icon || getIcon('note')
                })
              }
            }
            break
          }
          case 'pdfLabel': {
            const one = await ObjectStore(initialObject.type).getOneById(initialObject.objectId)
            if (one) {
              const { documentId } = one
              if (documentId) {
                const pdfMeta = MetaStore.getMetaObjectByObjectId(documentId)
                if (pdfMeta) {
                  setFromState({
                    name: `${pdfMeta.name}${one.page !== undefined ? ' ' + t('general.page') + ': ' + (one.page + 1) : ''}`,
                    icon: pdfMeta.icon || getIcon('pdf')
                  })
                }
              }
            }
          }
        }
      }
    }
    setAction()
  }, [initialObject])
  if (!fromState?.name) return null
  return (
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{t('general.from')}</div>
      <div>
        <IconNameItem icon={fromState?.icon} name={fromState?.name} />
      </div>
    </div>
  )
}

export default FormFromDisplayer
