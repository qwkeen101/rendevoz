import { CollectionStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import { useState } from 'react'
import React from 'react'
import ObjectFileUploader, { IFileUploaderTab } from '@/api/components/objectImporter/ObjectFileUploader'
import CommonObjectCreator from '@/api/components/objectImporter/CommonObjectCreator'
import { ObjectCreateHandler } from '@/core/global/components/ObjectCreator'

const FileImporter = ({
  onClose,
  onCreate,
  parentCollectionId,
  defaultTab
}: {
  onClose: VoidFunction
  onCreate?: (object: MetaObject, trigger?: boolean) => void
  parentCollectionId?: number
  defaultTab?: IFileUploaderTab
}) => {
  const [tab, setTab] = useState<IFileUploaderTab | undefined>(defaultTab)
  if (tab) {
    return (
      <ObjectFileUploader
        tab={tab}
        onCancel={onClose}
        onImport={i => {
          const availableURLs = i.urls.filter(i => i.uploaded)
          if (i.files.length) {
            Global.commonOps?.importFiles?.(i.files, { onImport: onCreate, parentCollectionId })
          }
          if (i.folders.length) {
            Global.commonOps?.importFolder?.(i.folders, { onImport: onCreate, parentCollectionId })
          }
          if (i.baidu.length) {
            Global.commonOps?.importBaidu?.(i.baidu, { onImport: onCreate, parentCollectionId })
          }
          if (availableURLs.length) {
            Global.commonOps?.importURLs?.(
              availableURLs.map(i => i.url),
              { onImport: onCreate, parentCollectionId }
            )
          }
          onClose?.()
        }}
      />
    )
  }
  return (
    <CommonObjectCreator
      onClose={onClose}
      onUpload={t => setTab(t)}
      onCreate={type => {
        ObjectCreateHandler[type]?.().then(res => {
          onCreate?.(res.meta, true)
          if (parentCollectionId) {
            CollectionStore.addItemToCollection({ type: 'meta', id: res.meta.id }, parentCollectionId)
          }
        })
      }}
    />
  )
}

export default FileImporter
