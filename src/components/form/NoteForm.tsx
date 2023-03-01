import { useState } from 'react'
import { INote } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const NoteForm = ({ onBack, onSubmit, initialObject }: IForm<INote>) => {
  const [note, setNote] = useState({ ...initialObject })
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: note.title,
        onChange: v => setNote({ ...note, title: v })
      },
      {
        type: 'group',
        children: [
          {
            type: 'colorPicker',
            color: note.color,
            onChange: c => setNote({ ...note, color: c })
          },
          {
            type: 'iconPicker',
            icon: note.icon,
            onChange: i => setNote({ ...note, icon: i })
          }
        ]
      }
    ],
    onBack,
    onSubmit: () => onSubmit?.(note),
    formTitle: 'Update Note Details',
    submitText: 'update'
  })

  return renderForm()
}

export default NoteForm
