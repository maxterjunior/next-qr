import { Dropdown, Image, QRCode } from "antd";
import QrGenerator from "qrcode";
import { memo, useMemo, useState } from "react";
import { ColorQr, useColorsQrStore } from "../core/store/colorsQr";
import { useSplitStore } from "../core/store/split";
import { ClearOutlined } from '@ant-design/icons';
import { Tab } from "../core/types";

const keyTabs = 'tabsStorage'

export const QrsContainer = memo(({ text, keyTab }: { text: string, keyTab: string }) => {

    const splitSpace = useSplitStore((e) => e.splitSpace) ? '\n' : /\s/
    const { colors, forceUpdate } = useColorsQrStore()

    const qrs = useMemo(() => text
        .trim()
        .split(splitSpace)
        .filter((e) => e?.length > 0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        , [text, splitSpace, colors])

    const focusQr = async (e: string) => {
        const qr = await QrGenerator.toDataURL(e, { errorCorrectionLevel: 'H', width: 300 })
        setVisible(qr)
    }

    setTimeout(() => {
        const dataLocal = window.tabsStorage
        const tab = dataLocal.find((e) => e.key === keyTab)
        if (tab) {
            tab.qrs = qrs || []
            tab.input = text
        }
        localStorage.setItem(keyTabs, JSON.stringify(dataLocal))
    }, 10)

    const [visible, setVisible] = useState<string | boolean>(false);

    const generateItems = (qr: string) => [
        ...colors.map((color) => ({
            key: color.uuid,
            label: <div className="flex flex-row gap-10">
                <div className="w-20 h-20" style={{ backgroundColor: color.color }}></div>
                <div>{color.label}</div>
            </div>,
            onClick: () => handlerQrPaint(qr, color)
        })),
        {
            key: 'clear',
            label: 'Clear',
            danger: true,
            icon: <ClearOutlined />,
            onClick: () => handlerQrPaint(qr, { color: '#000', label: 'Black', uuid: '', })
        }
    ]

    const handlerQrPaint = (code: string, color: ColorQr) => {
        const tab = window.tabsStorage.find((e) => e.key === keyTab) as Tab
        if (!tab) return
        if (!tab.painter) tab.painter = new Map()
        if (!color.uuid) tab.painter.delete(code)
        else tab.painter.set(code, color.uuid)
        tab.painterObject = Object.fromEntries(tab.painter)
        // Force update
        forceUpdate()
        setTimeout(() => localStorage.setItem(keyTabs, JSON.stringify(window.tabsStorage)), 10)
    }

    const getColor = (code: string) => {
        const tab = window.tabsStorage.find((e) => e.key === keyTab) as Tab
        if (!tab) return '#000'
        if (!tab.painter) return '#000'
        const color = tab.painter.get(code)
        if (!color) return '#000'
        const colorObj = colors.find((e) => e.uuid === color)
        if (!colorObj) return '#000'
        return colorObj.color
    }

    return <>
        <div className="flex gap-20 flex-wrap justify-center">
            {qrs.map((code, i) => <div key={i} className="flex flex-column gap-10 align-center">
                <Dropdown
                    menu={{ items: generateItems(code) }}
                    trigger={['contextMenu']}
                >
                    <QRCode
                        className="scale-hover cursor-pointer"
                        type="svg"
                        bgColor="#fff"
                        color={getColor(code)}
                        value={code}
                        onClick={() => focusQr(code)}
                    />
                </Dropdown>
                <div>{code}</div>
            </div>)}
        </div>

        <Image
            style={{
                display: 'none',
            }}
            preview={{
                visible: !!visible,

                src: visible as string,
                onVisibleChange: (value) => {
                    setVisible(value);
                },
            }}
        />
    </>
})