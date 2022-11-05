import useDb from '@/hooks/stores/useDb'
import useTime from '@/hooks/utils/useTime'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { ipcInstance } from '@/plugins'
import useDocumentStore from '@/stores/document.store'
import Id from '@/utils/id'
import { FC, memo, useRef } from 'react'
import { ICollection, IPdfDocument } from '~/typings/data'
import Form from '../../base/form'
import FormItem from '../../base/form/FormItem'
import { saveImageLocally } from '@/utils/img'
import PdfJsUrl from '@/assets/pdf.worker.min.js?url'
import { useTranslation } from 'react-i18next'
interface NewDocumentFormProps {
  onBack: () => void
  onSubmit: (pdfDocument: IPdfDocument) => void
  collection: ICollection
}
const NewDocumentForm: FC<NewDocumentFormProps> = ({ onBack, onSubmit, collection }) => {
  const { insertDocument } = useDocumentStore()
  const { t } = useTranslation()
  const fileRef = useRef<File>()
  const pdfDocument = useRef<IPdfDocument>({
    id: Id.getId(),
    updatedAt: useTime(),
    createdAt: useTime()
  })
  const blobDb = useDb('blobs')
  const pdfjs = usePdfjs()
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = PdfJsUrl
  }
  const handleExtractMetadataOfPdf = (file: File) => {
    file.arrayBuffer().then(buffer => {
      const loadingTask = pdfjs.getDocument(new Uint8Array(buffer))
      loadingTask.promise.then(pdf => {
        pdf.getMetadata().then(metadata => {
          const { Title, Author } = metadata.info
          pdfDocument.current.metadata = {
            title: Title,
            author: Author
          }
        })
        pdf.getPage(1).then(page => {
          const scale = 1
          const viewport = page.getViewport({ scale: scale })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width
          const renderCtx = { canvasContext: ctx, viewport: viewport }
          const renderTask = page.render(renderCtx)

          renderTask.promise.then(() => {
            const data = canvas.toDataURL('image/png')
            saveImageLocally(Id.getStrId(), data).then(data => {
              console.log(data)
              pdfDocument.current.metadata = {
                ...pdfDocument.current.metadata,
                coverUrl: data.data
              }
            })
            const id = Id.getId()
            blobDb.add({
              id: id,
              data
            })
            pdfDocument.current.metadata = {
              ...pdfDocument.current.metadata,
              coverBlobId: id
            }
          })
        })
      })
    })
  }
  const handleInsertDocument = async () => {
    const result = await ipcInstance.send('copyPdf', fileRef.current?.path, fileRef.current?.name)
    pdfDocument.current.fileUrl = result.data
    insertDocument(pdfDocument.current)
  }
  return (
    <Form
      onSubmit={() => {
        handleInsertDocument()
        onSubmit(pdfDocument.current)
      }}
      onBack={onBack}
      title={t('dialog.import new document')}
      description={t('dialog.please provide required information')}
    >
      <div style={{ fontSize: 16, marginBottom: 20, color: '#8590A6' }}>Collection: {collection.name}</div>
      <FormItem
        type="input"
        text={t('dialog.name')}
        requireMessage={t('dialog.name is required')}
        required
        onChange={e => {
          pdfDocument.current.name = e
        }}
      ></FormItem>
      <FormItem
        type="textarea"
        text={t('dialog.description')}
        onChange={e => {
          pdfDocument.current.description = e
        }}
      ></FormItem>
      <FormItem
        type="file"
        required
        requireMessage={t('dialog.you must upload one file')}
        onUpload={file => {
          fileRef.current = file
          handleExtractMetadataOfPdf(file)
        }}
      />
    </Form>
  )
}

export default memo(NewDocumentForm)
