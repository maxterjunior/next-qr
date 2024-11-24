import { Input, Modal, Tabs } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Footer } from './components/footer';
import { QrsContainer } from './components/qrs';
import { Tab } from './core/types';

const keyTabs = 'tabsStorage'

const tabsStorage = (JSON.parse(localStorage.getItem(keyTabs) || '[]') as Tab[])
  .map((tab, i) => ({ ...tab, key: i.toString(), painter: new Map(tab.painterObject ? Object.entries(tab.painterObject) : []) }))
const defaultTabKey = tabsStorage.find(({ selected }) => selected)?.key || '0'

window.tabsStorage = tabsStorage

function App() {

  const newTabIndex = useRef(tabsStorage.length);

  const [tabs, setTabs] = useState<Tab[]>(tabsStorage)

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action === 'add') {
      const newActiveKey = '' + newTabIndex.current++;
      const newPanes = [...tabs];
      newPanes.push({ name: 'New Tab #' + newTabIndex.current, input: '', date: dayjs().format('DD/MM/YYYY'), selected: false, key: newActiveKey, painter: new Map(), painterObject: {} });
      setTabs(newPanes);
    } else {
      Modal.confirm({
        title: '¿Estás seguro de querer eliminar esta pestaña?',
        onOk: () => {
          const index = tabs.findIndex(({ selected }) => selected)
          const filterTabs = tabs.filter(({ key }) => key !== targetKey as string);
          const key = filterTabs[index]?.key || filterTabs[index - 1]?.key || filterTabs[index + 1]?.key
          const newTabs = filterTabs.map((tab) => {
            if (tab.key === key) return { ...tab, selected: true }
            return { ...tab, selected: false }
          })
          setTabs(newTabs)
        }
      })
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>, key: string) => {
    const newTabs = tabs.map((tab) => {
      if (tab.key === key) {
        return { ...tab, input: e.target.value }
      }
      return tab
    })
    setTabs(newTabs)
  }

  useEffect(() => {
    window.tabsStorage = tabs
    if (!tabs.length)
      setTabs([{
        key: '' + newTabIndex.current++,
        name: 'New Tab #' + newTabIndex.current,
        input: '',
        date: dayjs().format('DD/MM/YYYY'),
        selected: true,
        painter: new Map(), painterObject: {}
      }])
    else
      localStorage.setItem(keyTabs, JSON.stringify(tabs))
  }, [tabs])

  useEffect(() => {
    const update = (e) => {
      if (e.type !== 'readQr') return
      const details = e.detail as string
      if (!details) return
      const newTabs = window.tabsStorage.map((tab) => {
        if (tab.selected) {
          tab.input += (' ' + details)
          return { ...tab }
        }
        return tab
      })
      setTabs(newTabs)
    }
    document.addEventListener('readQr', update)
    return () => document.removeEventListener('readQr', update)
  }, [])


  return (
    <>
      <Tabs
        className='mb-50'
        type="editable-card"
        defaultActiveKey={defaultTabKey}
        onChange={(key) => {
          const newTabs = tabs.map((tab) => {
            if (tab.key === key) return { ...tab, selected: true }
            return { ...tab, selected: false }
          })
          setTabs(newTabs)
        }}
        items={tabs.map((tab) => {
          return {
            key: tab.key,
            label: <Input
              style={{ width: 'auto' }}
              variant="borderless"
              value={tab.name}
              maxLength={20}
              onChange={(e) => {
                const newTabs = tabs.map((t) => {
                  if (t.key === tab.key) return { ...t, name: e.target.value }
                  return t
                })
                setTabs(newTabs)
              }}
            />,
            children: <div className='px-20 flex flex-column gap-20'>
              <TextArea
                placeholder="Escribe para comenzar"
                autoSize={{ minRows: 1, maxRows: 10 }}
                value={tab.input} onChange={(e) => handleInputChange(e, tab.key)} />
              <QrsContainer text={tab.input} keyTab={tab.key} />
            </div>,
          };
        })}
        onEdit={onEdit}
      />

      <Footer />
    </>
  )
}

export default App
