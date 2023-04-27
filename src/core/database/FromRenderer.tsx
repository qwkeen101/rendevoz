import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import Colors from '@/consts/colors'
import { ObjectStore, MetaStore } from '@/stores'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import Actions from '../Actions'

const FromRenderer = ({ metaObject: initialObject }: { metaObject?: MetaObject }) => {
  const [fromState, setFromState] = useState<{
    name?: string
    icon?: string
  }>()
  const { t } = useTranslation()
  useEffect(() => {
    const setAction = async () => {
      if (!initialObject) return
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
  const handleNavigateToFrom = async () => {
    if (initialObject?.type && initialObject.objectId) {
      const { type, objectId } = initialObject
      switch (type) {
        case 'image': {
          const image = await ObjectStore('image').getOneById(objectId)
          if (image) {
            const { from } = image
            if (from?.type === 'pdf') {
              const pages = from.pages
              const pdf = await Actions.openPdf(from.pdfId)
              if (pages) {
                pdf.jumpToPage?.(pages[0])
              }
            }
            if (from?.type === 'note') {
              const { noteId } = from
              Actions.openEditor(noteId)
            }
          }
          break
        }
        case 'noteLabel':
        case 'noteBlock': {
          const one = await ObjectStore(type).getOneById(objectId)
          if (one) {
            const { noteId } = one
            if (noteId) {
              Actions.openEditor(noteId)
            }
          }
          break
        }
        case 'pdfLabel': {
          const label = await ObjectStore(type).getOneById(objectId)
          if (label) {
            const { documentId } = label
            if (documentId) {
              Actions.openPdf(documentId)
            }
          }
        }
      }
    }
  }
  if (!fromState?.name) return null
  return (
    <IconNameItem
      style={{
        color: Colors.Font.Secondary,
        fontSize: '0.8rem',
        textTransform: 'none',
        cursor: 'pointer'
      }}
      onClick={() => {
        handleNavigateToFrom()
      }}
      name={fromState?.name}
      icon={fromState?.icon}
    />
  )
}

export default FromRenderer
