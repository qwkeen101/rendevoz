import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import commonActions, { GroupCommonActions } from '@/core/components/group/actions/commonActions'
import isHotkey from 'is-hotkey'

export const actionToShortcut: Record<
  GroupCommonActions,
  {
    text: string
    key: string
  }
> = {
  'delete-obj': {
    text: 'Cmd+D',
    key: 'mod+d'
  },
  'open-in-new-tab': {
    text: 'Shift+↵',
    key: 'shift+enter'
  },
  'copy-link': {
    text: 'Cmd+C',
    key: 'mod+c'
  },
  'copy-link-to-all': {
    text: 'Cmd+C',
    key: 'mod+c'
  },
  'delete-in-group': {
    text: 'D',
    key: 'd'
  },
  'view-details': {
    key: 'v',
    text: 'V'
  },
  'move-to': {
    text: 'M',
    key: 'm'
  },
  'open-in-side-peek': {
    text: 'Cmd+↵',
    key: 'mod+enter'
  }
}
export default (instance: InnerGroupInstance) => {
  return (e: KeyboardEvent) => {
    Object.entries(actionToShortcut).some(i => {
      if (isHotkey(i[1].key, e)) {
        const selected = instance.selectOps?.getSelectedItems()
        if (!selected?.length) return
        const only = selected.length === 1
        const first = selected[0][0]
        const customContext = instance.getGroupState?.().layout?.contextMenu?.(selected.map(i => i[0].id))
        switch (i[0] as GroupCommonActions) {
          case 'copy-link': {
            if (only) {
              commonActions(instance, 'copy-link')
            } else {
              commonActions(instance, 'copy-link-to-all')
            }
            break
          }
          case 'delete-in-group': {
            if (customContext) {
              if (customContext.some(i => i === 'deleteInGroup')) {
                commonActions(instance, 'delete-in-group')
              }
              break
            }
            commonActions(instance, 'delete-in-group')
            break
          }
          case 'delete-obj': {
            if (customContext) {
              if (customContext.some(i => i === 'deleteObject')) {
                commonActions(instance, 'delete-obj')
              }
              break
            }
            commonActions(instance, 'delete-obj')
            break
          }
          case 'edit': {
            break
          }
          case 'move-to': {
            commonActions(instance, 'move-to')
            break
          }
          case 'open-in-new-tab': {
            if (only) {
              commonActions(instance, 'open-in-new-tab')
            }
            break
          }
          case 'open-in-side-peek': {
            if (only) {
              commonActions(instance, 'open-in-side-peek')
            }
            break
          }
        }
        return true
      }
    })
  }
}
