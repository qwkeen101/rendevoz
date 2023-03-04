import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IWhiteboard } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const WhiteboardForm = ({ onBack, onSubmit, initialObject }: IForm<IWhiteboard>) => {
  const [whiteboard, setWhiteboard] = useState({ ...initialObject })
  const { t } = useTranslation()
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
    formTitle: t('form.update item details', { item: t('general.whiteboard') }),
    submitText: 'update'
  })

  return renderForm()
}

export default WhiteboardForm
