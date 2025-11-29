import { useNavigate, useLocation } from 'react-router-dom'
import { To, NavigateOptions } from 'react-router'
export default () => {
  const navigate = useNavigate()
  const location = useLocation()

  const customNavigate = (to: To | number, options: NavigateOptions | undefined = {}) => {
    if (location.pathname !== to) {
      if (typeof to === 'number') {
        navigate(to)
      } else {
        navigate(to, options)
      }
    }
  }

  return customNavigate
}
