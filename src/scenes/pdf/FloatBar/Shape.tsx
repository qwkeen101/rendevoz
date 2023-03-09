import { Content, Icon, Tooltip } from '@/components'
import DraggableElement from '@/components/globalDragOverlay/DraggbleElement'
import ClassName from '@/styles/classNames'
import { Flipped } from 'react-flip-toolkit'
import { IShapeLabel } from '~/typings/data'

export const PdfShapes: {
  icon: string
  name: IShapeLabel['shape']
}[] = [
  {
    icon: 'park-diamond-three',
    name: 'diamond'
  },
  {
    icon: 'park-rectangle-one',
    name: 'rectangle'
  },
  {
    icon: 'park-square',
    name: 'square'
  },
  {
    icon: 'park-round',
    name: 'round'
  },
  {
    icon: 'park-triangle',
    name: 'triangle'
  }
]
const PdfShape = ({ flipId }: { flipId: string }) => {
  return (
    <Flipped inverseFlipId={flipId}>
      <Content flex column gap={8} style={{ padding: '6px 12px' }}>
        <div className={ClassName.title()}>Add Custom Label</div>
        <div className={ClassName.description()}>Shapes</div>
        <Content flex style={{ flexWrap: 'wrap', width: 200, margin: '0px -5px' }}>
          {PdfShapes.map(i => (
            <DraggablePdfShape item={i} key={i.name} />
          ))}
        </Content>
      </Content>
    </Flipped>
  )
}

const DraggablePdfShape = ({ item }: { item: typeof PdfShapes[0] }) => {
  return (
    <DraggableElement
      draggingDetails={{
        type: 'pendingPdfElement',
        labelType: 'shape',
        shapeType: item.name
      }}
    >
      <Tooltip content={item.name} key={item.name}>
        <Icon size={30} name={item.icon} className={ClassName.circleButton(undefined, 4)} />
      </Tooltip>
    </DraggableElement>
  )
}
export default PdfShape
