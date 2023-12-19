import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Menu } from '@/components'
import { EditorTypeToElementMap } from '../maps'
import { RegisteredEditorElement } from '~/typings'
import { IMenuLayoutItem } from '@/components/base/menu'
import { useAtomValue } from 'jotai'
import { EditorOverlayStateAtom } from '@/core/components/editor/components/overlay/useEditorOverlay'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

const EditorElementsMenu = (props: { onAddElement: (blockName: string) => void }) => {
  const { onAddElement } = props
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const overlayState = useAtomValue(EditorOverlayStateAtom)
  const noResultTime = useRef(0)
  const menuItems = useMemo(() => {
    const basic: RegisteredEditorElement[] = [],
      inline: RegisteredEditorElement[] = [],
      block: RegisteredEditorElement[] = [],
      media: RegisteredEditorElement[] = []

    EditorTypeToElementMap.forEach(item => {
      if (item.registerInMenu?.addMenu) {
        switch (item.registerInMenu.menuType) {
          case 'basic':
            basic.push(item)
            break
          case 'block':
            block.push(item)
            break
          case 'inline':
            inline.push(item)
            break
          case 'media':
            media.push(item)
            break
        }
      }
    })
    const lowerer = overlayState.currentFilterValue?.toLocaleLowerCase()
    // /hooks/useTypeFilterBlocks
    let menuItems: IMenuLayoutItem[] = []
    const transformElementToMenuItem = (item: RegisteredEditorElement): IMenuLayoutItem | undefined => {
      const displayName = typeof item.name === 'string' ? item.name : item.name?.()
      if (displayName) {
        if (lowerer) {
          if (displayName.toLocaleLowerCase().includes(lowerer) || item.type.includes(lowerer)) {
            return {
              key: item.type,
              text: displayName,
              icon: item.registerInMenu?.icon,
              type: 'item'
            } as IMenuLayoutItem
          }
          return
        }
        return {
          key: item.type,
          text: displayName,
          icon: item.registerInMenu?.icon,
          type: 'item'
        } as IMenuLayoutItem
      }
    }
    const basicItems = basic.map(i => transformElementToMenuItem(i)).filter(i => i) as IMenuLayoutItem[]
    const blockItems = block.map(i => transformElementToMenuItem(i)).filter(i => i) as IMenuLayoutItem[]
    const inlineItems = inline.map(i => transformElementToMenuItem(i)).filter(i => i) as IMenuLayoutItem[]
    const mediaItems = media.map(i => transformElementToMenuItem(i)).filter(i => i) as IMenuLayoutItem[]
    if (basicItems.length) {
      menuItems = [
        {
          type: 'title',
          name: 'Basic'
        },
        ...basicItems
      ]
    }
    if (blockItems.length) {
      menuItems = [
        ...menuItems,
        {
          type: 'title',
          name: 'Block'
        },
        ...blockItems
      ]
    }
    if (inlineItems.length) {
      menuItems = [
        ...menuItems,
        {
          type: 'title',
          name: 'Inline'
        },
        ...inlineItems
      ]
    }
    if (mediaItems.length) {
      menuItems = [
        ...menuItems,
        {
          type: 'title',
          name: 'Media'
        },
        ...mediaItems
      ]
    }
    if (menuItems.length === 0) {
      noResultTime.current += 1
    } else {
      noResultTime.current = 0
    }
    if (noResultTime.current > 4) {
      instance.overlayOps?.close()
    }
    return menuItems
  }, [overlayState.currentFilterValue])
  return (
    <Content
      column
      flex
      style={{
        padding: '0.25rem 0',
        minWidth: 240,
        maxHeight: '40vh',
        overflowY: 'auto'
      }}
    >
      {menuItems.length ? (
        <Menu.NavigationMenu
          onSelect={e => {
            if (e.type === 'item') {
              const key = e.key
              onAddElement?.(key)
            }
          }}
          layout={menuItems}
        />
      ) : (
        <div
          style={{
            padding: '4px 8px',
            fontWeight: 600,
            color: 'var(--font-transparent)'
          }}
        >
          No results
        </div>
      )}
    </Content>
  )
}

export default EditorElementsMenu
