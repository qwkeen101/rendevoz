import { Editor, Path } from 'slate'
import { RenderElementProps } from 'slate-react'
import { CustomElement } from '~/typings'
import { ReactEditor, useSlate } from '@/core'
import useToggleList from '@/core/components/editor/elements/listItem/useToggleList'
import { Colors } from '@/consts'
import classnames from 'classnames'

const BorderIndent = ({ index }: { index: number }) => {
  // 20: initial margin left, 15: indent
  const offset = 24 * (index + 1)
  return (
    <div
      contentEditable={false}
      className={'li-indent'}
      style={{
        left: -offset
      }}
    ></div>
  )
}

export const ListItem = ({ children, element }: RenderElementProps) => {
  const { containerRef, canToggle, toggle } = useToggleList(element)
  return (
    <div ref={containerRef} style={{ display: 'flex' }}>
      {element.level && element.level > 0 ? (
        <>
          {Array.from(Array(element.level)).map((i, index) => (
            <BorderIndent index={index} key={index} />
          ))}
        </>
      ) : null}
      <div
        role="list-item-marker"
        data-level={element.level}
        contentEditable={false}
        className={classnames('ul-marker', element.folded && 'folded', canToggle && 'foldable')}
        // prevent lose selection
        onPointerDown={e => e.preventDefault()}
        onClick={() => {
          if (canToggle) {
            toggle()
          }
        }}
      ></div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function getDictionary() {
  return validateDictionary('abcdefghijklmnopqrstuvwxyz')

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
  const editor = useSlate()
  const { containerRef, canToggle, toggle } = useToggleList(element)

  const path = ReactEditor.findPath(editor, element)

  const loopGetNumber = () => {
    if (!Path.hasPrevious(path)) return 1
    let previousPath = Path.previous(path)
    try {
      let previous = Editor.node(editor, previousPath)
      let num = 1
      while (
        (previous && (previous[0] as CustomElement).type === 'order-list-item') ||
        (previous[0].type !== 'list-item' && previous[0].level !== undefined && previous[0].level >= 0)
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

  const getPrefix = () => {
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
  }
  const prefix = getPrefix()
  return (
    <div
      style={{
        position: 'relative'
      }}
      ref={containerRef}
    >
      {element.level && element.level > 0 ? (
        <div contentEditable={false}>
          {Array.from(Array(element.level)).map((i, index) => (
            <BorderIndent index={index} key={index} />
          ))}
        </div>
      ) : null}
      <span
        contentEditable={false}
        onClick={() => {
          if (canToggle) {
            toggle()
          }
        }}
        onPointerDown={e => {
          e.preventDefault()
        }}
        role="list-item-marker"
        className={'ol-marker'}
        style={{
          color: element.folded ? Colors.Common.SelectColor : undefined
        }}
      >
        {prefix}.{' '}
      </span>
      {children}
    </div>
  )
}
export default ListItem
