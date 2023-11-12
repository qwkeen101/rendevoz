import { CSSProperties, ReactNode } from 'react'
import { MetaObject } from '~/typings'
import { IconWithPopover, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { ObjectActionPopover } from '@/core'

export type OptionRendererProps = {
  customNode?: ReactNode
  style?: CSSProperties
  iconName?: string
  renderOnParent?: boolean
  zIndex?: number
  onClickOutside?: (e: MouseEvent, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => void
}
export default ({
  iconName = 'park-more',
  style,
  customNode,
  renderOnParent,
  onClickOutside,
  zIndex,
  metaId
}: OptionRendererProps & { metaId: number }) => {
  return (
    <IconWithPopover
      renderOnParent={renderOnParent}
      containerStyle={{
        position: 'absolute',
        top: 0,
        right: 10,
        zIndex: 10,
        ...style
      }}
      onClickOutside={onClickOutside}
      closeOnContentClick
      placement={['right', 'left']}
      align="start"
      zIndex={zIndex}
      padding={0}
      name={iconName}
      className={ClassName.circleButton(2)}
      disableIntersection
      content={
        customNode || (
          <WithBorder>
            <ObjectActionPopover metaObjectId={metaId} />
          </WithBorder>
        )
      }
    ></IconWithPopover>
  )
}
