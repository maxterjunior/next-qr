import { ConfigProvider, theme } from 'antd'
import esEs from 'antd/locale/es_ES'
import { memo } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useThemeStore } from './core/store/theme'
import './index.scss'
import './utils.scss'

//! configuracion de dayjs
// importacion de plugin para dayjs
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
dayjs.extend(weekOfYear)

import locale_es from 'dayjs/locale/es'
dayjs.locale(locale_es)

export const Main = () => {
  const { isDark } = useThemeStore()
  if (isDark)
    document.body.classList.add('dark')
  else
    document.body.classList.remove('dark') 
  return (<ComponentAlgorithm isDark={isDark} />)
}

const ComponentAlgorithm = memo(({ isDark }: { isDark: boolean }) => {
  return <ConfigProvider locale={esEs} theme={{
    algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,],
  }}>
    <App />
  </ConfigProvider>
})


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Main />)