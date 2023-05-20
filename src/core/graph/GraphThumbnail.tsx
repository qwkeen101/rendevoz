import { ReactNode, ReactPortal, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Content, Icon, Modal } from '@/components'
import { atom } from 'jotai/vanilla'
import { useAtom } from 'jotai/react'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { GlobalGraphInstance } from '.'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
export const globalGraphMinimizedAtom = atom(false)
const GraphThumbnail = ({ children, onClose }: { children: ReactNode; onClose: VoidFunction }) => {
  const [small, setSmall] = useAtom(globalGraphMinimizedAtom, { store: globalStore })
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const cachedChildrenRef = useRef<HTMLDivElement>()
  const [topLevelChildren, setTopLevelChildren] = useState<ReactPortal>()

  Object.assign(GlobalGraphInstance, {
    minimize: () => setSmall(true),
    maximize: () => setSmall(false)
  } as Partial<typeof GlobalGraphInstance>)

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
    cachedChildrenRef.current = undefined
    const div = document.createElement('div')
    div.style.width = '100%'
    div.style.height = '100%'

    const portal = createPortal(children, div, 'cached-graph')
    setTopLevelChildren(portal)
    cachedChildrenRef.current = div
    containerRef.current?.appendChild(div)
  }, [children])

  useLayoutEffect(() => {
    if (cachedChildrenRef.current) {
      if (!small) {
        containerRef.current?.appendChild(cachedChildrenRef.current)
      }
    } else {
      const div = document.createElement('div')
      div.style.width = '100%'
      div.style.height = '100%'
      const portal = createPortal(children, div, 'cached-graph')
      setTopLevelChildren(portal)
      cachedChildrenRef.current = div
      if (!small) {
        containerRef.current?.appendChild(cachedChildrenRef.current)
      }
    }
  }, [small])

  return createPortal(
    <>
      {topLevelChildren}
      {small && (
        <Content
          position="absolute"
          flex
          justifyContent="space-between"
          alignItems="center"
          gap={40}
          className={ClassName.Background.blurBackground}
          style={{
            bottom: 30,
            right: 30,
            borderRadius: 999,
            padding: '6px 16px',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            fontFamily: 'Muli',
            fontWeight: 600
          }}
        >
          <Content
            flex
            gap={8}
            onClick={() => setSmall(false)}
            className={css({
              position: 'relative',
              width: 'fit-content',
              textDecoration: 'underline 1px rgba(0,0,0,0)',
              transition: 'text-decoration-color 0.3s ease',
              ':hover': {
                textDecorationColor: 'rgba(0,0,0,0.8)'
              },
              cursor: 'pointer'
            })}
          >
            <Icon name="park-full-screen-one" />
            {t('graph.full screen graph')}
          </Content>
          <Icon
            className={ClassName.circleButton()}
            name="park-close"
            onClick={() => {
              GlobalGraphInstance.close?.()
              setSmall(false)
            }}
          />
        </Content>
      )}
      <Modal visible={!small} onClose={() => setSmall(true)} noStyle>
        <div
          style={{
            position: 'relative',
            width: '90vw',
            height: '90vh',
            pointerEvents: 'auto',
            borderRadius: 6,
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            overflow: 'hidden'
          }}
        >
          <div
            className={ClassName.Background.blurBackground}
            style={{ position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', zIndex: -1 }}
          ></div>
          <Content fullHeight fullWidth ref={containerRef}></Content>
        </div>
      </Modal>
    </>,
    document.body,
    'graph-thumbnail'
  )
}

export default GraphThumbnail
