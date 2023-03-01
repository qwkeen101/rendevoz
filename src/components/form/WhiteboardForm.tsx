import { useState } from 'react'
import { IWhiteboard } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const WhiteboardForm = ({ onBack, onSubmit, initialObject }: IForm<IWhiteboard>) => {
  const [whiteboard, setWhiteboard] = useState({ ...initialObject })
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: whiteboard.name,
        onChange: v => setWhiteboard({ ...whiteboard, name: v })
      },
      {
        type: 'group',
        children: [
          {
            type: 'colorPicker',
            color: whiteboard.color,
            onChange: c => setWhiteboard({ ...whiteboard, color: c })
          },
          {
            type: 'iconPicker',
            icon: whiteboard.icon,
            onChange: i => setWhiteboard({ ...whiteboard, icon: i })
          }
        ]
      }
    ],
    onBack,
    onSubmit: () => onSubmit?.(whiteboard),
    formTitle: 'Update Whiteboard Details',
    submitText: 'update'
  })

  return renderForm()
}

export default WhiteboardForm
