import { memo, useCallback, useRef, useEffect } from 'react'
import { NodeRendererProps, IWhiteboardNode } from '../../types'

type TextNodeType = IWhiteboardNode & { type: 'text' }

/**
 * Text node renderer - simplified implementation using contentEditable
 * Note: This is a basic implementation. For production, consider using a rich text editor like Slate
 */
const TextNodeRenderer = memo(({ node, selected, onChange, onClick }: NodeRendererProps<TextNodeType>) => {
    const textNode = node as TextNodeType
    const divRef = useRef<HTMLDivElement>(null)
    const isComposingRef = useRef(false)

    // Extract text content from Slate Descendant array
    const getTextContent = useCallback(() => {
        if (!textNode.content || !Array.isArray(textNode.content)) return ''

        return textNode.content
            .map(block => {
                if ('children' in block && Array.isArray(block.children)) {
                    return block.children.map(child => ('text' in child ? child.text : '')).join('')
                }
                return ''
            })
            .join('\n')
    }, [textNode.content])

    // Convert text back to Slate format
    const textToSlateContent = useCallback((text: string) => {
        const lines = text.split('\n')
        return lines.map(line => ({
            type: 'paragraph',
            children: [{ text: line }]
        }))
    }, [])

    // Update content when node changes externally
    useEffect(() => {
        if (divRef.current && !isComposingRef.current) {
            const currentText = divRef.current.innerText
            const nodeText = getTextContent()
            if (currentText !== nodeText) {
                divRef.current.innerText = nodeText
            }
        }
    }, [textNode.content, getTextContent])

    const handleInput = useCallback(
        (e: React.FormEvent<HTMLDivElement>) => {
            if (isComposingRef.current) return

            const text = e.currentTarget.innerText
            const newContent = textToSlateContent(text)

            onChange({
                content: newContent as any
            })
        },
        [onChange, textToSlateContent]
    )

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true
    }, [])

    const handleCompositionEnd = useCallback(
        (e: React.CompositionEvent<HTMLDivElement>) => {
            isComposingRef.current = false
            handleInput(e as any)
        },
        [handleInput]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            onClick?.(e)
        },
        [onClick]
    )

    return (
        <div
            ref={divRef}
            contentEditable={selected}
            suppressContentEditableWarning
            onInput={handleInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onClick={handleClick}
            style={{
                width: '100%',
                height: '100%',
                padding: '8px 12px',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                cursor: selected ? 'text' : 'default',
                userSelect: selected ? 'text' : 'none'
            }}
        >
            {getTextContent()}
        </div>
    )
})

TextNodeRenderer.displayName = 'TextNodeRenderer'

export default TextNodeRenderer
