import useTime from '@/hooks/utils/useTime'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { ipcInstance } from '@/plugins'
import createDocumentStore from '@/stores/document.store'
import Id from '@/utils/id'
import { FC, memo, useRef } from 'react'
import { ICollection, IPdfDocument } from '~/typings/data'
import Form from '../base/form'
import FormItem from '../base/form/FormItem'
import { saveImageLocally } from '@/utils/img'
import { useTranslation } from 'react-i18next'
import ClassName from '@/styles/classNames'
import { useToggle } from '@/hooks'
import { FileUploader } from '../base'
import { toast } from 'react-hot-toast'
import SwitchAnimation from '../base/animation/SwitchAnimation'
import { useUpdate } from 'react-use'

interface NewDocumentFormProps {
  onBack: () => void
  onSubmit: (pdfDocument: IPdfDocument) => void
  collection: ICollection
}
const CreateDocumentForm: FC<NewDocumentFormProps> = ({ onBack, onSubmit, collection }) => {
  const [isFileUploaded, toggleFileUploaded] = useToggle(false)

  const { addDocument } = createDocumentStore()
  const { t } = useTranslation()
  const fileRef = useRef<File>()
  const forceRender = useUpdate()
  const pdfDocument = useRef<IPdfDocument>({
    id: Id.getId(),
    updatedAt: useTime(),
    createdAt: useTime(),
    name: 'Untitled Document'
  })

  const pdfjs = usePdfjs()
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
          forceRender()
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
          })
        })
      })
    })
  }
  const handleInsertDocument = async () => {
    const result = await ipcInstance.send('copyPdf', fileRef.current?.path, fileRef.current?.name)
    pdfDocument.current.fileUrl = result.data
    addDocument(pdfDocument.current)
  }
  const renderUploadFile = () => {
    return (
      <div>
        <div className={ClassName.title()}>Upload Document</div>
        <FileUploader
          accept="application/pdf"
          onFileUploaded={file => {
            if (file && file.type === 'application/pdf') {
              fileRef.current = file
              handleExtractMetadataOfPdf(file)
              toggleFileUploaded(true)
            } else {
              toast.error('Not Allowed File')
            }
          }}
        />
      </div>
    )
  }
  const renderForm = () => {
    return (
      <Form
        onSubmit={() => {
          handleInsertDocument()
          onSubmit(pdfDocument.current)
        }}
        onBack={() => toggleFileUploaded(false)}
        title="Fill Document Details"
        submitText="create"
      >
        <div className={ClassName.description()}>
          <div className={ClassName.ellipsisFont(1)}>Collection: {collection.name}</div>
          <div className={ClassName.ellipsisFont(4)}>File: {fileRef.current?.name || 'Unknown file'}</div>
          <div className={ClassName.ellipsisFont(2)}>Title: {pdfDocument.current.metadata?.title || 'Unknown'}</div>
          <div className={ClassName.ellipsisFont(1)}>Author: {pdfDocument.current.metadata?.author || 'Unknown'}</div>
        </div>
        <FormItem
          type="input"
          text={t('dialog.name')}
          onChange={e => {
            pdfDocument.current.name = e
          }}
        ></FormItem>
        <FormItem
          type="textarea"
          text={t('dialog.description')}
          onChange={e => {
            pdfDocument.current.description = e || 'Untitled Document'
          }}
        ></FormItem>
      </Form>
    )
  }
  return (
    <SwitchAnimation direction={isFileUploaded}>
      {switchWrapper => (isFileUploaded ? switchWrapper(renderForm(), 'form') : switchWrapper(renderUploadFile(), 'upload'))}
    </SwitchAnimation>
  )
}

export default memo(CreateDocumentForm)
