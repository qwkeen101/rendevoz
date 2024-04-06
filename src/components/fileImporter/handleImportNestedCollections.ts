import { categorizeFilesByPath } from '@/components/fileImporter/baidudisk/handleImportAllAndCreateCollections'
import { GlobalImporterInstance } from '@/core/global/components/FileImportProcessor'
import { MetaObject } from '~/typings'

export default async (files: File[], onCreate?: (m: MetaObject) => void, parentCollectionId?: number) => {
  const dirname = files[0].webkitRelativePath.split('/')[0]
  const normalizedPath = files[0].path.replaceAll('\\', '/')
  const curr = normalizedPath.indexOf(dirname)
  const sliced = normalizedPath.slice(0, curr) + dirname

  const categorized = categorizeFilesByPath(files, sliced)
  const rootKey = Object.keys(categorized)[0]
  const outParent = parentCollectionId
  const rootFiles = Array.from(Object.values(categorized[rootKey])).filter(i => typeof i === 'object' && i instanceof File)

  GlobalImporterInstance.import?.(rootFiles, {
    isDir: true,
    dirName: rootKey,
    onImport: onCreate,
    parentCollectionId: parentCollectionId ?? 0,
    onEnd: result => {
      if (result?.collectionId) {
        const loop = (o: any, parentCollectionId: number) => {
          const keys = Object.keys(o)
          keys.forEach(async key => {
            const v = o[key]
            if (typeof v === 'object' && v instanceof File) {
              return
            } else if (typeof v === 'object') {
              const name = key
              const files = Array.from(Object.values(v)).filter(i => typeof i === 'object' && i instanceof File)
              console.log(files)
              GlobalImporterInstance.import?.(files, {
                isDir: true,
                dirName: name,
                onImport: m => {
                  // do not trigger here, becuase collection do the work
                  if (outParent) return
                  onCreate?.(m)
                },
                parentCollectionId: parentCollectionId,
                onEnd: result => {
                  if (result?.collectionId) {
                    loop(v, result.collectionId)
                  }
                }
              })
            }
          })
        }
        loop(categorized[rootKey], result.collectionId)
      }
    }
  })
  console.log(categorized)
}
