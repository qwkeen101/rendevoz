import { css } from '@emotion/css'
import React, { memo } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import { Content, Icon } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import classnames from 'classnames'

// @ts-ignore
const nonNullClass = css({
  ':is(:not(:has(> :empty)):not(:empty),[data-show-cover="true"])': {
    paddingBottom: '75%',
    borderBottom: '1px solid var(--border-background)'
  },
  '*': {
    pointerEvents: 'none !important'
  }
})

const containImgClass = css({
  img: {
    objectFit: 'contain !important'
  }
})
export default memo(
  ({
    metaId,
    thumbnailMode,
    hideCoverIfEmpty,
    onClick
  }: {
    metaId: number
    hideCoverIfEmpty?: boolean
    thumbnailMode?: boolean
    onClick?: React.MouseEventHandler
  }) => {
    const metaObject = MetaStore.useValue(metaId)
    const fitImage = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.fitImage) ?? false
    return (
      <div
        data-show-cover={!hideCoverIfEmpty}
        style={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: thumbnailMode ? 'unset' : undefined,
          cursor: 'pointer'
        }}
        onClick={onClick}
        className={classnames(nonNullClass, fitImage && containImgClass)}
      >
        <InnerContentDisplayer
          metaId={metaId}
          labelMaxHeight={false}
          containerStyle={{
            position: 'absolute',
            top: '0',
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          imageFit={fitImage ? 'contain' : 'cover'}
        />
        {thumbnailMode && metaObject && !metaObject?.type.includes('Label') && (
          <Content
            alignItems={'center'}
            flex
            gap={8}
            style={{
              maxWidth: 'calc(100% - 20px)',
              position: 'absolute',
              left: 6,
              bottom: 6,
              background: 'rgba(20, 20, 20, .85)',
              color: 'white',
              fontSize: 13,
              padding: '4px 6px',
              borderRadius: 4,
              lineHeight: '18px'
            }}
          >
            <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} />
            {metaObject.name && <div className={'ellipsis-font-1'}>{metaObject.name}</div>}
          </Content>
        )}
      </div>
    )
  }
)
