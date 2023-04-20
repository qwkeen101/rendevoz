import useTime from '@/hooks/utils/useTime'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { ipcInstance } from '@/plugins'
import Id from '@/utils/id'
import { FC, memo, useRef } from 'react'
import { IPdfDocument, MetaObject } from '~/typings/data'
import { saveImageLocally } from '@/utils/img'
import ClassName from '@/styles/classNames'
import { useToggle } from '@/hooks'
import { Content, FileUploader } from '../base'
import { toast } from 'react-hot-toast'
import { ObjectStore } from '@/stores'
import ObjectForm from './ObjectForm'

interface NewDocumentFormProps {
  onBack: () => void
  onSubmit: (meta: MetaObject) => void
}
const CreateDocumentForm: FC<NewDocumentFormProps> = ({ onBack, onSubmit }) => {
  const [isFileUploaded, toggleFileUploaded] = useToggle(false)

  const fileRef = useRef<File>()

  const pdfDocument = useRef<IPdfDocument>({
    id: Id.getId(),
    updatedAt: useTime(),
    createdAt: useTime(),
    name: 'Untitled Document'
  })

  const pdfjs = usePdfjs()

  const handleExtractMetadataOfPdf = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument(new Uint8Array(buffer))
    const pdf = await loadingTask.promise
    const metadata = await pdf.getMetadata()
    const { Title, Author } = metadata.info
    pdfDocument.current.metadata = {
      title: Title,
      author: Author
    }

    const page = await pdf.getPage(1)
    const scale = 1
    const viewport = page.getViewport({ scale: scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    const renderCtx = { canvasContext: ctx, viewport: viewport }
    const renderTask = page.render(renderCtx)

    await renderTask.promise
    const data = canvas.toDataURL('image/png')
    const imageData = await saveImageLocally(Id.getStrId(), data)
    pdfDocument.current.metadata = {
      ...pdfDocument.current.metadata,
      coverUrl: imageData.data
    }
  }
  const handleInsertDocument = async (obj: Partial<MetaObject>): Promise<MetaObject> => {
    const result = await ipcInstance.send('copyPdf', fileRef.current?.path, fileRef.current?.name)
    pdfDocument.current.fileUrl = result.data
    // addDocument(pdfDocument.current)
    const { meta, one } = await ObjectStore('pdf').addOneWithMeta(pdfDocument.current, { currentMeta: obj })
    return meta
  }
  const renderUploadFile = () => {
    return (
      <Content className={ClassName.Background.pseudoBlurContrastBackground} flex column gap={10} style={{ padding: 12, borderRadius: 8 }}>
        <div className={ClassName.title()}>Upload Document</div>
        <FileUploader
          accept="application/pdf"
          onFileUploaded={async file => {
            if (file && file.type === 'application/pdf') {
              fileRef.current = file
              await handleExtractMetadataOfPdf(file)
              toggleFileUploaded(true)
            } else {
              toast.error('Not Allowed File')
            }
          }}
        />
      </Content>
    )
  }
  return isFileUploaded ? (
    <ObjectForm
      initialObject={{
        type: 'pdf',
        name: pdfDocument.current.metadata?.title || 'Unnamed PDF',
        coverImgSrc: pdfDocument.current.metadata?.coverUrl
      }}
      onBack={toggleFileUploaded}
      onSubmit={async obj => {
        const meta = await handleInsertDocument(obj)
        onSubmit(meta)
      }}
    />
  ) : (
    renderUploadFile()
  )
}

export default memo(CreateDocumentForm)
