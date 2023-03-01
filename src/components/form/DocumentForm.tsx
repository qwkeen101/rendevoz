import { useState } from 'react'
import { IPdfDocument } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const DocumentForm = ({ onBack, onSubmit, initialObject }: IForm<IPdfDocument>) => {
  const [document, setDocument] = useState({ ...initialObject })
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: document.name,
        onChange: v => setDocument({ ...document, name: v })
      },
      {
        type: 'group',
        children: [
          {
            type: 'colorPicker',
            color: document.color,
            onChange: c => setDocument({ ...document, color: c })
          },
          {
            type: 'iconPicker',
            icon: document.icon,
            onChange: i => setDocument({ ...document, icon: i })
          }
        ]
      }
    ],
    onBack,
    onSubmit: () => onSubmit?.(document),
    formTitle: 'Update Document Details',
    submitText: 'update'
  })

  return renderForm()
}

export default DocumentForm
