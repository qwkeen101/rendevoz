import { useEventHandler, useScopedEventEmitter } from '@/events'
import { css } from '@emotion/css'
import { useEffect, useMemo } from 'react'
import { useUpdate } from 'react-use'
import { Editor, Path } from 'slate'
import { RenderElementProps } from 'slate-react'
import { CustomElement } from '~/typings'
import { ReactEditor, useSlateStatic } from '../../slate-react'
import styles from './index.module.less'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import useToggleList from '@/core/editor/elements/listItem/useToggleList'
import { Colors } from '@/consts'

const BorderIndent = ({ index }: { index: number }) => {
  // 20: initial margin left, 15: indent
  const offset = 24 * (index + 1)
  return (
    <div
      contentEditable={false}
      style={{
        position: 'absolute',
        top: -3,
        bottom: -3,
        left: -offset,
        userSelect: 'none',
        pointerEvents: 'none',
        width: 1,
        transform: 'translateX(calc(0.2em))',
        background: Colors.Background.Border
      }}
    ></div>
  )
}

export const ListItem = ({ children, element }: RenderElementProps) => {
  const { containerRef, canToggle, toggle } = useToggleList(element)
  return (
    <div className={styles.wrapper} ref={containerRef}>
      {element.level && element.level > 0 ? (
        <div contentEditable={false}>
          {Array.from(Array(element.level)).map((i, index) => (
            <BorderIndent index={index} key={index} />
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', marginRight: 1 }} contentEditable={false}>
        <div contentEditable={false} role="list-item-marker" data-level={element.level} className={styles.markerWrapper}>
          <div
            contentEditable={false}
            onClick={() => {
              if (canToggle) {
                toggle()
              }
            }}
            className={styles.marker}
            data-collapse={canToggle}
            data-folded={element.folded}
            data-level={element.level}
            style={{ marginLeft: 0 }}
          ></div>
        </div>
      </div>
      <span role="list-item-line-wrapper" style={{ minWidth: 2 }}>
        {children}
      </span>
    </div>
  )
}

function getDictionary() {
  return validateDictionary('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

  function validateDictionary(dictionary) {
    for (let i = 0; i < dictionary.length; i++) {
      if (dictionary.indexOf(dictionary[i]) !== dictionary.lastIndexOf(dictionary[i])) {
        console.log('Error: The dictionary in use has at least one repeating symbol:', dictionary[i])
        return undefined
      }
    }
    return dictionary
  }
}
function numberToEncodedLetter(number: number): string {
  //Takes any number and converts it into a base (dictionary length) letter combo. 0 corresponds to an empty string.
  //It converts any numerical entry into a positive integer.
  if (isNaN(number)) {
    return undefined
  }
  number = Math.abs(Math.floor(number))

  const dictionary = getDictionary()
  let index = number % dictionary.length
  let quotient = number / dictionary.length
  let result

  if (number <= dictionary.length) {
    return numToLetter(number)
  } //Number is within single digit bounds of our encoding letter alphabet

  if (quotient >= 1) {
    //This number was bigger than our dictionary, recursively perform this function until we're done
    if (index === 0) {
      quotient--
    } //Accounts for the edge case of the last letter in the dictionary string
    result = numberToEncodedLetter(quotient)
  }

  if (index === 0) {
    index = dictionary.length
  } //Accounts for the edge case of the final letter; avoids getting an empty string

  return result + numToLetter(index)

  function numToLetter(number: number) {
    //Takes a letter between 0 and max letter length and returns the corresponding letter
    if (number > dictionary.length || number < 0) {
      return undefined
    }
    if (number === 0) {
      return ''
    } else {
      return dictionary.slice(number - 1, number)
    }
  }
}
const RomanNumerMap = {
  M: 1000,
  CM: 900,
  D: 500,
  CD: 400,
  C: 100,
  XC: 90,
  L: 50,
  XL: 40,
  X: 10,
  IX: 9,
  V: 5,
  IV: 4,
  I: 1
}
const intToRoman = (num: number) => {
  let result = ''

  for (const key in RomanNumerMap) {
    const repeatCounter = Math.floor(num / RomanNumerMap[key])

    if (repeatCounter !== 0) {
      result += key.repeat(repeatCounter)
    }

    num %= RomanNumerMap[key]

    if (num === 0) return result
  }

  return result
}
export const OrderListItem = ({ children, element }: RenderElementProps) => {
  const editor = useSlateStatic()
  const scopedEmitter = useScopedEventEmitter()
  const handler = useEventHandler('editor')
  const { containerRef, canToggle, toggle } = useToggleList(element)
  useEffect(() => {
    scopedEmitter.addListener('editor', handler)
    return () => {
      scopedEmitter.removeListener('editor', handler)
    }
  }, [])

  const path = ReactEditor.findPath(editor, element)

  const forceUpdate = useUpdate()
  handler.on('valueChange', () => {
    setTimeout(() => {
      if (!Path.equals(path, ReactEditor.findPath(editor, element))) {
        forceUpdate()
      }
    })
  })

  const loopGetNumber = () => {
    if (!Path.hasPrevious(path)) return 1
    let previousPath = Path.previous(path)
    try {
      let previous = Editor.node(editor, previousPath)
      let num = 1
      while (
        previous &&
        ((previous[0] as CustomElement).type === 'list-item' || (previous[0] as CustomElement).type === 'order-list-item')
      ) {
        const el = previous[0] as CustomElement
        if ((el.level || 0) < (element.level || 0)) break
        if ((el.level || 0) !== (element.level || 0)) {
          if (!Path.hasPrevious(previousPath)) break
          previousPath = Path.previous(previous[1])
          previous = Editor.node(editor, previousPath)
          continue
        }
        if (el.type === 'order-list-item') {
          num += 1
        }
        if (!Path.hasPrevious(previousPath)) break
        previousPath = Path.previous(previous[1])
        previous = Editor.node(editor, previousPath)
      }
      return num
    } catch (e) {
      return 1
    }
  }

  const prefix = useMemo(() => {
    const number = loopGetNumber()
    if (element.level === 0 || element.level === undefined || element.level % 3 === 0) {
      return number
    }
    if (element.level === 1 || element.level % 3 === 1) {
      return numberToEncodedLetter(number)
    }
    if (element.level === 2 || element.level % 3 === 2) {
      return intToRoman(number)
    }
    return number
  }, [...path, element.level])

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {element.level && element.level > 0 ? (
        <div contentEditable={false}>
          {Array.from(Array(element.level)).map((i, index) => (
            <BorderIndent index={index} key={index} />
          ))}
        </div>
      ) : null}
      <div
        contentEditable={false}
        onClick={() => {
          if (canToggle) {
            toggle()
          }
        }}
        data-level={element.level}
        role="list-item-marker"
        style={{
          whiteSpace: 'nowrap',
          textTransform: 'lowercase',
          fontFamily: 'Muli',
          padding: '0 2px',
          marginRight: 6,
          minWidth: 18,
          fontWeight: 500,
          cursor: 'pointer',
          color: element.folded ? Colors.Common.SelectColor : undefined
        }}
      >
        {prefix}.{' '}
      </div>
      <span role="list-item-line-wrapper" className={css({ width: '100%' })}>
        {children}
      </span>
    </div>
  )
}
export default ListItem
