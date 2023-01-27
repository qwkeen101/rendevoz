import { useState } from 'react'
import { IPdfDocument } from '~/typings/data'
import { Form } from '..'
import { IForm } from './types'

const EditDocumentForm = ({ onBack, onSubmit, initialObject }: IForm<IPdfDocument>) => {
  const [document, setDocument] = useState({ ...initialObject })
  return (
    <Form
      title="Edit document"
      onSubmit={() => {
        onSubmit?.(document)
      }}
      onBack={onBack}
      backText="back"
      submitText="submit"
    >
      <Form.Item
        text="Name"
        type="input"
        onChange={e => {
          setDocument({ ...document, name: e })
        }}
      />
    </Form>
  )
}

export default EditDocumentForm
