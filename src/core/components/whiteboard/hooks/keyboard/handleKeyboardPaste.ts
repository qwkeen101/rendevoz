import { IWhiteboardInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export default (e: KeyboardEvent, instance: IWhiteboardInstance) => {
  if (isHotkey('mod+v', e)) {
    navigator.clipboard.read().then(i =>
      i.forEach(o => {
        if (o.types.includes('text/plain')) {
          o.getType('text/plain')
            .then(p => p.text())
            .then(t => {
              const splitted = t.split('\n')
              if (splitted.every(i => i.startsWith('rendevoz://object/'))) {
                const objectIds = splitted.map(i => Number(i.replace('rendevoz://object/', ''))).filter(i => !Number.isNaN(i)) as number[]
                const pointerPos = mousePos.current
                instance.insertMetasAtPointer?.({ clientY: pointerPos[1], clientX: pointerPos[0] }, objectIds)
              }
            })
        }
      })
    )
  }
}
