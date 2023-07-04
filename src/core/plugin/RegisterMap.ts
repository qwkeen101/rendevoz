import { ReactElement } from 'react'
import { DropOn, MetaLink, MetaObject } from '~/typings'
import { RegisteredSetting } from '~/typings/registered'

export const KeyToRegisterdSettings = new Map<string, RegisteredSetting>()

export const KeyToRegisteredSidebarElement = new Map<
  string,
  | ReactElement
  | {
      icon: string
      text: string
      onClick: React.MouseEventHandler
    }
>()

export const KeyToRegisteredDropOnProcessor = new Map<
  string,
  (dropOn: DropOn, sourceMetaObject: MetaObject) => Promise<MetaLink[] | void>
>()

export const KeyToRegisteredGlobalElements = new Map<string, () => ReactElement>()
