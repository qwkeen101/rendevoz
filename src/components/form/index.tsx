import NoteForm from './NoteForm'
import ObjectForm from './ObjectForm'

interface IFormType {
  Object: typeof ObjectForm
  Note: typeof NoteForm
}

const FormType: IFormType = {
  Object: ObjectForm,
  Note: NoteForm
}

export default FormType
