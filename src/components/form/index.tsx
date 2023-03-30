import DocumentForm from './DocumentForm'
import NoteForm from './NoteForm'
import ObjectForm from './ObjectForm'

interface IFormType {
  Document: typeof DocumentForm
  Object: typeof ObjectForm
  Note: typeof NoteForm
}

const FormType: IFormType = {
  Document: DocumentForm,
  Object: ObjectForm,
  Note: NoteForm
}

export default FormType
