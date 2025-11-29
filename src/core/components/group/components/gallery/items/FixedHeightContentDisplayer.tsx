import { css } from '@emotion/css'
import React, { memo } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import classnames from 'classnames'
import { SimpleObject } from '@/core'

// @ts-ignore
const nonNullClass = css({
  ':is(:not(:has(> :empty)):not(:empty),[data-show-cover="true"])': {
    aspectRatio: '16 / 9'
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
    className,
    onClick
  }: {
    metaId: number
    hideCoverIfEmpty?: boolean
    thumbnailMode?: boolean
    onClick?: React.MouseEventHandler
    className?: string
  }) => {
    const fitImage = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.fitImage) ?? false
    if (thumbnailMode) {
      return (
        <SimpleObject
          enableContextMenu={false}
          onClick={onClick}
          clickable={false}
          withDefaultPadding={false}
          metaObjectId={metaId}
          mode={'thumbnail'}
          draggable={false}
          bg={'transparent'}
        />
      )
    }
    return (
      <>
        <div
          data-show-cover={!hideCoverIfEmpty}
          style={{
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={onClick}
          className={classnames(nonNullClass, fitImage && containImgClass, className)}
        >
          <InnerContentDisplayer
            metaId={metaId}
            containerStyle={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
            imageFit={fitImage ? 'contain' : 'cover'}
          />
        </div>
      </>
    )
  }
)
