import React, { ReactNode } from 'react'
import { MetaObject } from '~/typings'

export * from './editor'
export * from './video'
export * from './webpage'
export * from './pdf'
export * from './whiteboard'

export type MetaFormLayoutItem =
  | {
      type: 'nameInput'
      disabled?: boolean
      onChange: (v: string) => void
      value?: string
    }
  | {
      type: 'input'
      disabled?: boolean
      onChange?: (v: string) => void
      value?: string
      text?: string
    }
  | {
      type: 'descriptionInput'
      onChange: (v: string) => void
      value?: string
    }
  | {
      type: 'tagPicker'
      tags?: number[]
      onChange: (tags: string[]) => void
    }
  | {
      type: 'colorPicker'
      color?: string
      onChange?: (color: string | undefined) => void
    }
  | {
      type: 'addDesc'
      value?: string
    }
  | {
      type: 'tagDisplayer'
      tags?: number[]
    }
  | {
      type: 'iconPicker'
      icon?: string
      onChange: (icon: string | undefined) => void
    }
  | {
      type: 'imagePicker'
      imageUrl?: string
      onChange: (url: string | undefined) => void
      name: string
    }
  | {
      type: 'group'
      children: MetaFormLayoutItem[] | MetaFormLayoutItem | undefined
    }
  | {
      type: 'previewGraph'
      onClick?: React.MouseEventHandler
    }
  | {
      type: 'custom'
      children: ReactNode
    }
  | {
      type: 'fromDisplayer'
      object: Partial<MetaObject>
      onRemove?: VoidFunction
    }
  | {
      type: 'markdownImporter'
      onClose?: VoidFunction
    }
  | {
      type: 'attachmentDisplayer'
      attachments: Required<MetaObject['attachments']>
    }
  | {
      type: 'filePathPicker'
      maxWidth?: any
      filePath: string
      accept?: HTMLInputElement['accept']
      enableWeb?: boolean
      enableBaidudisk?: boolean
      baidudiskCategory?: number
      onChange: (
        value:
          | {
              type: 'local'
              filePath: string | undefined
              fileName: string | undefined
              file: File | undefined
            }
          | {
              type: 'baidudisk'
              url: string
              name: string
            }
          | {
              type: 'web'
              url: string
            }
          | {
              type: 'clear'
            }
      ) => void
    }
  | {
      type: 'attchmentManager'
      attachments: MetaObject['attachments']
      onChange: (atts?: MetaObject['attachments']) => void
      metaId: number
    }
  | undefined
