import { AnimatePresence, motion } from 'framer-motion'
import React, { memo, RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CustomElement } from '~/typings'

export default memo(
  ({ selected = false, blockRef, element: e }: { selected: boolean; blockRef: RefObject<HTMLElement>; element: CustomElement }) => {
    const element = blockRef.current
    const [targetEle, setTargetEle] = useState<HTMLElement>()
    useEffect(() => {
      const target = element?.classList.contains('selectable') ? element : element?.querySelector('.selectable')
      setTargetEle(target)
    }, [e, selected])
    return (
      targetEle &&
      createPortal(
        <AnimatePresence>
          {selected && (
            <motion.div
              contentEditable={'false'}
              transition={{ duration: 0.2 }}
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={'SelectedBlock'}
            ></motion.div>
          )}
        </AnimatePresence>,
        targetEle
      )
    )
  }
)
