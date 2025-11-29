import { Button } from '@/components/base/button'
import { css } from '@emotion/css'
import Content from './Content'
import errorImg from '@/assets/error.png'
import { ipcInstance } from '@/electron'

const ErrorFallback = ({ error }) => {
  return (
    <Content flex column fullHeight fullWidth centered>
      <img
        draggable={false}
        className={css({
          width: 200,
          userSelect: 'none'
        })}
        src={errorImg}
      />
      <div
        className={css({
          fontSize: '2rem',
          fontWeight: 500,
          marginBottom: 20
        })}
      >
        Oops, something went wrong!
      </div>
      <p
        className={css({
          fontSize: '1rem'
        })}
        style={{ maxWidth: '80vw' }}
      >
        Error Message: {error.message || 'Unknown error'}
      </p>
      <p
        className={css({
          fontSize: '0.928rem',
          marginBottom: 20
        })}
      >
        This seems to be a bug, you can report to github issues!
      </p>
      <Button
        className={css({
          padding: '6px 12px'
        })}
        onClick={() => {
          localStorage.removeItem('layout')
          ipcInstance.send('reload')
        }}
      >
        Reload application
      </Button>
    </Content>
  )
}

export default ErrorFallback
