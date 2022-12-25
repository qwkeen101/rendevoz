import { Content } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { MetaKnowledgeObject } from '~/typings/data'
import { TitleClassName, TitleWrapperClassName } from './DatabaseCard'
import { memo } from 'react'
import ClassName from '@/styles/classNames'
import { GlobalLayout } from '@/components/layout'
import { useNavigate } from 'react-router-dom'
const MetaKnowledgeCard = memo(({ m }: { m: MetaKnowledgeObject }) => {
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const navigate = useNavigate()
  return (
    <Content flex column>
      <Content className={TitleWrapperClassName}>
        <div
          className={TitleClassName}
          onClick={() => {
            navigate(`/editor/${m.noteId}`)
          }}
        >
          {m.name || m.keyword}
        </div>
        <div
          className={css([
            {
              color: defaultFontColorGrey,
              fontSize: 13
            },
            ClassName.ellipsisFont(6)
          ])}
        >
          {m.description}
        </div>
      </Content>
    </Content>
  )
})

export default MetaKnowledgeCard
