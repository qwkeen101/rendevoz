import { Content, Icon } from '@/components'
import { KEY } from '@/consts/key'
import { useTheme } from '@/hooks'
import useClickOutside from '@/hooks/utils/useClickOutside'
import useMetaStore from '@/stores/meta.store'
import { css } from '@emotion/css'
import { formatDistanceToNow } from 'date-fns'
import { useState, useRef, useEffect } from 'react'
import { MetaComment, MetaKnowledgeObject } from '~/typings/data'

const MetaCommentItem = ({ comment, obj }: { comment?: MetaComment; obj?: MetaKnowledgeObject }) => {
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const [isEditing, setIsEditing] = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [content, setContent] = useState(comment?.content)
  const { addMetaComment, updateMetaComment, deleteMetaComment } = useMetaStore()
  const [toolbarVisible, setToolbarVisible] = useState(false)
  useEffect(() => {
    setContent(comment?.content)
  }, [comment])
  const commentRef = useRef<HTMLDivElement>(null)
  useClickOutside(() => {
    setIsEditing(false)
    commentRef.current?.blur()
  }, commentRef)
  useEffect(() => {
    if (!comment && commentRef.current) {
      commentRef.current.focus()
    }
  }, [])
  useEffect(() => {
    if (isModifying) {
      setIsEditing(true)
      commentRef.current?.focus()
    }
  }, [isModifying])
  const handleAddMetaComment = () => {
    if (isModifying) {
      handleModifyMetaComment()
      return
    }
    if (obj) {
      const content = commentRef.current?.textContent
      if (content) {
        addMetaComment(obj.id, {
          content
        })
        commentRef.current.textContent = ''
      }
    }
  }
  const handleModifyMetaComment = () => {
    if (comment) {
      const content = commentRef.current?.textContent
      if (content) {
        updateMetaComment({
          id: comment.id,
          content
        })
        commentRef.current.textContent = ''
        setContent(content)
      }
      setIsModifying(false)
    }
  }
  const renderContent = () => (
    <Content flex alignItems="stretch">
      <div
        contentEditable
        placeholder="Add a comment"
        ref={commentRef}
        spellCheck={'false'}
        onFocus={() => setIsEditing(true)}
        onKeyDown={e => {
          if (e.key === KEY.Enter) {
            e.preventDefault()
            e.stopPropagation()
            handleAddMetaComment()
          }
        }}
        className={css({
          outline: 'none',
          transition: 'background 0.2s ease',
          cursor: isEditing ? 'text' : 'pointer',
          padding: '2px 10px 2px 6px',
          borderRadius: 4,
          minWidth: 200,
          wordBreak: 'break-all',
          flex: 'auto',
          '&[contenteditable]': {
            ':empty': {
              ':after': {
                content: 'attr(placeholder)',
                WebkitTextFillColor: defaultFontColorGrey
              }
            }
          },
          ':hover': isEditing
            ? undefined
            : {
                background: 'rgba(0,0,0,0.06)'
              }
        })}
      >
        {content}
      </div>
      {isEditing && (
        <Content flex style={{ flexDirection: 'column-reverse', alignItems: 'end', marginLeft: 8 }}>
          <Icon onClick={handleAddMetaComment} cursor="pointer" name="park-arrow-circle-up" size={24} theme="filled" fill="#8590ae" />
        </Content>
      )}
    </Content>
  )

  if (comment) {
    return (
      <Content
        flex
        column
        onMouseEnter={() => setToolbarVisible(true)}
        onMouseLeave={() => setToolbarVisible(false)}
        className={css({
          padding: '2px 10px 2px 6px',
          wordBreak: 'break-all'
        })}
      >
        <div
          className={css({
            color: defaultFontColorGrey,
            fontSize: 12,
            lineHeight: '21px',
            display: 'flex',
            justifyContent: 'space-between'
          })}
        >
          <span>{formatDistanceToNow(comment.updatedAt, { addSuffix: true })}</span>
          <div
            className={css({
              opacity: toolbarVisible ? 1 : 0,
              transition: 'all 0.2s ease',
              pointerEvents: toolbarVisible ? 'auto' : 'none',
              display: 'flex',
              gap: 7
            })}
          >
            <Icon
              onClick={e => {
                setIsModifying(!isModifying)
                e.stopPropagation()
              }}
              className={css({
                padding: 4,
                borderRadius: 4,
                transition: 'all 0.2s ease',
                ':hover': {
                  background: 'rgba(0,0,0,0.06)'
                }
              })}
              name="park-edit"
              size={14}
              cursor="pointer"
            />
            <Icon
              onClick={() => {
                if (comment && obj) {
                  deleteMetaComment(obj.id, comment.id)
                }
              }}
              className={css({
                padding: 4,
                borderRadius: 4,
                transition: 'all 0.2s ease',
                ':hover': {
                  background: 'rgba(0,0,0,0.06)'
                }
              })}
              name="park-delete"
              size={14}
              cursor="pointer"
            />
          </div>
        </div>
        {isModifying ? renderContent() : <div>{content}</div>}
      </Content>
    )
  }
  return renderContent()
}

export default MetaCommentItem
