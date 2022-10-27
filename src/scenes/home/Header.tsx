import { Content } from '@/components'
import { getHours } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'

const Header = () => {
  const { t } = useTranslation()
  const { defaultFontColorBlack } = useTheme('defaultFontColorBlack')
  const currentHour = getHours(new Date())
  let currentTime
  if (currentHour >= 1 && currentHour < 11) {
    currentTime = 'Morning'
  }
  if (currentHour >= 11 && currentHour < 13) {
    currentTime = 'Noon'
  }
  if (currentHour >= 13 && currentHour < 18) {
    currentTime = 'Afternoon'
  }
  if (currentHour >= 18 && currentHour < 22) {
    currentTime = 'Evening'
  }
  if (currentHour >= 22 && currentHour < 23) {
    currentTime = 'Night'
  }
  if (currentHour >= 23 || currentHour === 0) {
    currentTime = 'Midnight'
  }
  return (
    <Content
      className={css({
        width: '100%',
        padding: '16px 20px'
      })}
      flex
      alignItems="center"
      justifyContent="space-between"
    >
      <div
        className={css({
          color: defaultFontColorBlack,
          fontSize: 30,
          fontFamily: 'Muli,sans-serif',
          fontWeight: 500,
          userSelect: 'none'
        })}
      >
        {t('home.greeting', { time: currentTime })}
      </div>
    </Content>
  )
}
export default Header
