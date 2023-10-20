import { MetaStore } from '@/stores'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useEffect, useState } from 'react'
import { Content, Icon, ResizeAndDrag } from '@/components'
import Main from '@/core/object/details/Main'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import FormTagPicker from '@/components/form/FormTagPicker'
import { RelatedPanel } from './Related'

const ObjectDetails = ({ metaId }: { metaId: number }) => {
  const meta = MetaStore.useValue(metaId)
  const [currentDisplay, setCurrentDisplay] = useState<{
    visible: 'main' | 'tags' | 'links'
  }>({
    visible: 'main'
  })
  useEffect(() => {
    setCurrentDisplay({ visible: 'main' })
  }, [metaId])
  return (
    <Content flex column fullHeight fullWidth>
      {currentDisplay.visible === 'main' && (
        <Main
          onOpenTag={() => {
            setCurrentDisplay({ visible: 'tags' })
          }}
          onViewLinks={() => {
            setCurrentDisplay({ visible: 'links' })
          }}
          metaId={metaId}
        />
      )}
      {currentDisplay.visible === 'tags' && (
        <FormTagPicker
          onClose={() => setCurrentDisplay({ visible: 'main' })}
          tags={meta?.tags || []}
          onChange={tags => {
            MetaStore.updateMetaObject({ id: metaId, tags })
          }}
        />
      )}
      {currentDisplay.visible === 'links' && <RelatedPanel metaId={metaId} />}
    </Content>
  )
}

export const GlobalObjectDetails = () => {
  const [gState, setGState] = useState<{
    visible: boolean
    metaId?: number
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      openDetails: id => {
        setGState({ visible: true, metaId: id })
      }
    }
  })
  const currentMeta = MetaStore.useValue(gState.metaId)
  return (
    <ResizeAndDrag
      style={{
        visibility: gState.visible ? 'visible' : 'hidden',
        pointerEvents: gState.visible ? 'auto' : 'none',
        zIndex: 999999,
        background: Colors.Background.Secondary,
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 12
      }}
      default={{
        x: 500,
        y: 500,
        width: 500,
        height: 500
      }}
      dragHandleClassName={'o-d-h'}
    >
      <Content
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
        style={{
          padding: '4px 12px',
          fontWeight: 600,
          width: '100%',
          cursor: 'grab',
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
        className={'o-d-h'}
      >
        <div className={ClassName.ellipsisFont(1)} style={{ maxWidth: '80%', fontSize: 13 }}>
          {currentMeta?.name}
        </div>
        <Icon
          name={'park-close'}
          onClick={() => {
            setGState({ visible: false })
          }}
          className={ClassName.circleButton()}
        />
      </Content>
      <Content style={{ width: '100%', height: '100%', padding: 24 }}>{gState.metaId && <ObjectDetails metaId={gState.metaId} />}</Content>
    </ResizeAndDrag>
  )
}

export default ObjectDetails
