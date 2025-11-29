import { CustomElement } from '~/typings'
import { Resizable, ResizableProps } from 're-resizable'
import { ReactEditor, useSlateStatic } from '@/core'
import { Transforms } from 'slate'
import { useIsIn } from '@/hooks'

export default ({ element, children, ...rest }: { element: CustomElement } & ResizableProps) => {
  const editor = useSlateStatic()
  const { isIn, ref } = useIsIn()
  return (
    <Resizable
      {...rest}
      ref={e => {
        ref.current = e?.resizable
      }}
      className={'selectable'}
      onResizeStop={(event, direction, elementRef, delta) => {
        const p = ReactEditor.findPath(editor, element)
        Transforms.setNodes(
          editor,
          {
            width: elementRef.clientWidth,
            height: elementRef.clientHeight
          },
          {
            at: p
          }
        )
      }}
      maxWidth={rest.maxWidth ?? '100%'}
      size={{
        width: element.width ?? rest.size?.width ?? rest.defaultSize?.width ?? '100%',
        height: rest.enable && rest.enable.bottom ? element.height ?? rest.size?.height ?? rest.defaultSize?.height ?? 'auto' : 'auto'
      }}
      handleStyles={{
        left: {
          height: '30%',
          border: '1px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          borderRadius: 99,
          width: 5,
          opacity: isIn ? 1 : 0,
          left: 2,
          transition: 'opacity 0.3s ease',
          background: 'black'
        },
        bottom: {
          width: '60%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '1px solid white',
          borderRadius: 99,
          height: 5,
          bottom: 2,
          transition: 'opacity 0.3s ease',
          opacity: isIn ? 1 : 0,
          background: 'black'
        },
        right: {
          height: '30%',
          top: '50%',
          transform: 'translateY(-50%)',
          border: '1px solid white',
          borderRadius: 99,
          width: 5,
          right: 2,
          transition: 'opacity 0.3s ease',
          opacity: isIn ? 1 : 0,
          background: 'black'
        }
      }}
    >
      {children}
    </Resizable>
  )
}
