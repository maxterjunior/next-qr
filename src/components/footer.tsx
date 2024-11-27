import { BgColorsOutlined, CloseOutlined, DownloadOutlined, EditOutlined, GithubOutlined, HeartTwoTone, InstagramOutlined, LinkedinOutlined, PlusOutlined, PrinterOutlined, QrcodeOutlined, RestOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Dropdown, Form, Image, Input, InputNumber, Modal, Space, Switch, Tooltip } from "antd";
import { ItemType } from 'antd/es/menu/interface';
import Link from 'antd/es/typography/Link';
import { message } from 'antd/lib';
import QrScanner from "qr-scanner";
import QrGenerator from "qrcode";
import { useState } from 'react';
import ZebraBrowserPrintWrapper from 'zebra-browser-print-wrapper';
import { ColorQr, useColorsQrStore } from '../core/store/colorsQr';
import { ConfigZebra, useConfigZebraStore } from '../core/store/configZebra';
import { useSplitStore } from '../core/store/split';
import { useThemeStore } from '../core/store/theme';
import yape from '/yape-cristian.webp';

const BASE_URL = import.meta.env.BASE_URL


const printPdf = async () => {

    const tabs = window.tabsStorage

    const codes = tabs.find((e) => e.selected as boolean)?.qrs || []
    const imgs = await Promise.all(codes.map(e => QrGenerator.toDataURL(e, { width: 200 })))

    const html = `
        <html>
            <head>
                <title>Impresión de Qrs</title>
                <meta charset="utf-8">
                    <style>
                        .qr {
                            display: inline-block;
                        margin: 10px;
                        text-align: center;
          }
                        .qr img {
                            width: 200px;
                        height: 200px;
          }
                        .qr p {
                            margin: 0;
                        font-size: 24px;
                        font-family: sans-serif;
                        font-weight: bold;
                        white-space: nowrap;
          }
                    </style>

            </head>
            <body onload="window.print();">
                ${imgs.map((v, i) => `<div class="qr"><img src="${v}" ></img><p>${codes[i]}</p></div>`).join(" ")}
            </body>
            </html>
            `
    // ${data.map((v) => `<div class="qr"><img src="https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${v}&choe=UTF-8" ></img><p>${v}</p></div>`).join(" ")}

    const win = window.open("", "print", "width=1000,height=600");
    win!.document.write(html);
    win!.document.close();
}

const readQr = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new window.Image();
                img.src = e.target?.result as string;
                img.onload = async () => {
                    try {
                        const code = await QrScanner.scanImage(img, {})
                        if (code) {
                            message.success('Código QR leído correctamente');
                            document.dispatchEvent(new CustomEvent('readQr', { detail: code }));
                        } else {
                            message.error('No se pudo leer el código QR');
                        }
                    } catch (error) {
                        console.error(error);
                        message.error('No se pudo leer el código QR');
                    }
                }
            }
            reader.readAsDataURL(file);
        }
    }
}

const printZebra = async (config: ConfigZebra = { uuid: '0', label: 'default', itemsLabel: 4, yAlign: 3.6, xAlignBase: 1, xAlignFactor: 26.1, fontSize: '0,2', qrSize: 0.9, maxLength: 23, qrYAlign: 0 }) => {

    const qrs = window.tabsStorage.find((e) => e.selected as boolean)?.qrs || []

    const arraySplit = (arr: string[], size: number) => arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), [] as string[][]);
    const trimText = (length: number, text: string) => text.length > length ? text.substring(0, length) : text;

    const centerText = (length: number, text: string) => {
        const diff = length - text.length;
        const left = Math.floor(diff / 2);
        const right = Math.ceil(diff / 2);
        return ' '.repeat(left) + text + ' '.repeat(right);
    }

    const round = (num: number) => Math.round(num * 100) / 100;

    let commands = '';

    const filas = arraySplit(qrs, config.itemsLabel);


    for (const [index, fila] of filas.entries()) {

        commands += `^XA
^MUM
^${index === filas.length - 1 ? 'MMC' : 'MMT'}
^PW1800
^LL1218
^LS0 
`;

        for (const [index, qr] of fila.entries()) {

            commands += `
          ^FT${round(1.2 + config.xAlignBase + index * config.xAlignFactor)},${round(config.yAlign + 21.7 + config.qrYAlign)}
          ^BQN,2,${config.qrSize}
          ^FDLA,${qr}
          ^FS

          ^FT${round(config.xAlignBase + index * config.xAlignFactor)},${round(config.yAlign)}
          ^A0N,${config.fontSize}
          ^FH\
          ^FD${centerText(config.maxLength, trimText(config.maxLength, qr))}
          ^FS

          ^FT${round(config.xAlignBase + index * config.xAlignFactor)},${round(config.yAlign + 21.8)}
          ^A0N,${config.fontSize}
          ^FH\
          ^FD${trimText(config.maxLength, qr)}
          ^FS

          ^FT${round(.8 + config.xAlignBase + index * config.xAlignFactor)},${round(config.yAlign + 20)}
          ^A0B,${config.fontSize}
          ^FH\
          ^FD${trimText(config.maxLength, qr)}
          ^FS

          ^FT${round(22.8 + config.xAlignBase + index * config.xAlignFactor)},${round(config.yAlign + 20)}
          ^A0B,${config.fontSize}
          ^FH\
          ^FD${trimText(config.maxLength, qr)}
          ^FS
`;

        }

        commands += `^PQ1,0,1,Y^XZ`;

    }

    const browserPrint = new ZebraBrowserPrintWrapper();

    // List printers
    const printers = await browserPrint.getAvailablePrinters();

    // Validar que printers no sea un Error
    if (printers instanceof Error) return message.error(printers.message);

    // Select default printer 
    if (printers.length === 0) return message.error('No se encontraron impresoras');

    const defaultPrinter = printers[0];

    // Set the printer
    browserPrint.setPrinter(defaultPrinter);

    // Check printer status
    const printerStatus = await browserPrint.checkPrinterStatus();

    // Check if the printer is ready
    if (printerStatus.isReadyToPrint) {
        const zpl = commands;
        browserPrint.print(zpl);
    } else {
        console.error("Error/s", printerStatus.errors);
        message.error('Print:' + printerStatus.errors);
    }

}

const uuid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);


export const Footer = () => {

    const { isDark, toggleTheme } = useThemeStore()
    const [yapeVisible, setYapeVisible] = useState(false);
    const useConfigZebra = useConfigZebraStore()
    const useColors = useColorsQrStore()
    const useSplit = useSplitStore()


    const [modalConfig, setModalConfig] = useState<ConfigZebra | null>(null);
    const [formConfig] = Form.useForm();
    const onFinishConfig = (values) => {
        if (modalConfig?.uuid) {
            useConfigZebra.updateConfig({ uuid: modalConfig.uuid, ...values });
            message.success('Configuración actualizada');
        } else {
            useConfigZebra.addConfig({ uuid: uuid(), ...values });
            message.success('Configuración agregada');
        }
        setModalConfig(null);
    }

    const itemsPrinter = [
        {
            key: 'p1',
            label: 'Guardar como PDF',
            onClick: () => printPdf()
        },
        {
            key: 'p2',
            label: 'Zebra Browser Print',
            children: [
                ...useConfigZebra.configs.map((config) => ({
                    key: config.uuid,
                    label: <div className="flex flex-row gap-10" onClick={() => printZebra(config)}>
                        {config.label}
                    </div>,
                    extra: <Space>
                        <Button name='edit-button' type='text' icon={<EditOutlined />}
                            onClick={() => {
                                formConfig.setFieldsValue(config)
                                setModalConfig(config)
                            }} />
                        <Button name='delete-button' type='text' danger icon={<CloseOutlined />}
                            onClick={() => {
                                useConfigZebra.removeConfig(config);
                                message.success('Configuración eliminada');
                            }} />
                    </Space>

                })),
                {
                    key: 'p2-1',
                    icon: <PlusOutlined />,
                    label: 'Agregar configuración',
                    onClick: () => {
                        formConfig.setFieldsValue({ label: '', itemsLabel: 4, yAlign: 3.6, xAlignBase: 1, xAlignFactor: 26.1, fontSize: '0,2', qrSize: 0.9, maxLength: 23, qrYAlign: 0 })
                        setModalConfig({ uuid: '', label: '', itemsLabel: 4, yAlign: 3.6, xAlignBase: 1, xAlignFactor: 26.1, fontSize: '0,2', qrSize: 0.9, maxLength: 23, qrYAlign: 0 })
                    }
                },
                {
                    key: 'p2-2',
                    icon: <DownloadOutlined />,
                    label: (<Link href={BASE_URL + 'zebra-browser-print-windows.exe'} target='_blank' rel='noreferrer'>
                        Descargar Driver
                    </Link>),
                },
            ]
        },
    ]


    const [modalColor, setModalColor] = useState<ColorQr | null>(null);
    const [form] = Form.useForm();
    const onFinishColor = (values) => {
        if (modalColor?.uuid) {
            useColors.updateColor({ uuid: modalColor.uuid, label: values.label, color: values.color?.toHexString?.() || values.color });
            message.success('Color actualizado');
        } else {
            useColors.addColor({ uuid: uuid(), label: values.label, color: values.color?.toHexString?.() || values.color });
            message.success('Color agregado');
        }
        setModalColor(null);
    }

    const itemsColor: ItemType[] = [...useColors.colors.map((color) => ({
        key: color.uuid,
        label: <div className="flex flex-row gap-10 w-full" onClick={() => {
            form.setFieldsValue({ label: color.label, color: color.color })
            setModalColor(color)
        }}>
            <div className="w-20 h-20" style={{ backgroundColor: color.color }}></div>
            <div>{color.label}</div>
        </div>,
        extra: <Button name='delete-button' type='text' danger icon={<CloseOutlined />}
            onClick={() => {
                useColors.removeColor(color);
                message.success('Color eliminado');
            }} />
    })),
    {
        key: 'add',
        label: 'Agregar color',
        icon: <PlusOutlined />,
        onClick: () => {
            form.setFieldsValue({ label: '', color: '' })
            setModalColor({ uuid: '', label: '', color: '' })
        },
    }];

    return <div className='fixed bottom-0 w-full flex flex-row flex-between'>
        <div className='flex-center-row gap-15 px-10 text-black'>
            <a href='https://www.instagram.com/_cventurac/' target='_blank' rel='noreferrer' className='text-black text-20'>
                <InstagramOutlined />
            </a>

            <a href='https://www.linkedin.com/in/vecacriju/' target='_blank' rel='noreferrer' className='text-black text-20'>
                <LinkedinOutlined />
            </a>

            <a href='https://github.com/maxterjunior' target='_blank' rel='noreferrer' className='text-black text-20'>
                <GithubOutlined />
            </a>

            <Tooltip title="Invita un café">
                <RestOutlined className='text-20' onClick={() => setYapeVisible(true)} />
            </Tooltip>

            <p> <HeartTwoTone twoToneColor="#eb2f96" className='text-20' /> por <a href="https://github.com/maxterjunior">Mj.asm</a> </p>

            <Image alt='yape'
                style={{ display: 'none' }}
                preview={{
                    visible: yapeVisible,
                    src: yape,
                    onVisibleChange: (value) => {
                        setYapeVisible(value);
                    },
                }}
            />

            <Switch checked={isDark} onChange={toggleTheme} checkedChildren="🌙" unCheckedChildren="☀️" />
        </div>

        <div className='flex-center-row gap-10 px-10 text-black'>

            <Modal
                title={modalConfig ? 'Editar configuración' : 'Agregar configuración'}
                open={!!modalColor}
                onCancel={() => setModalColor(null)}
                onOk={() => { form.submit() }}
            >
                <Form form={form} onFinish={onFinishColor} >
                    <Form.Item name='label' label='Nombre' rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name='color' label='Color' rules={[{ required: true }]}>
                        <ColorPicker showText />
                    </Form.Item>
                </Form>
            </Modal>

            <Dropdown menu={{ items: itemsColor }} >
                <Button type="text" icon={<BgColorsOutlined />} size='large' />
            </Dropdown>

            <Tooltip title='Leer código QR'>
                <Button type="text" icon={<QrcodeOutlined />} onClick={() => readQr()} size='large' />
            </Tooltip>

            <Tooltip title='Cambiar modo de separación'>
                <Switch checkedChildren="\n" unCheckedChildren="/\s/" checked={useSplit.splitSpace} onChange={useSplit.toggleSplit} />
            </Tooltip>

            <Modal
                title={modalConfig?.uuid ? 'Editar configuración' : 'Agregar configuración'}
                open={!!modalConfig}
                footer={[
                    <Button key="print" type='dashed' onClick={() => {
                        printZebra(formConfig.getFieldsValue() as ConfigZebra)
                    }}>
                        Imprimir
                    </Button>,
                    <Button key="back" onClick={() => setModalConfig(null)}>
                        Cancelar
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => formConfig.submit()}>
                        Guardar
                    </Button>,
                ]}
            >
                <Form form={formConfig} onFinish={onFinishConfig} >
                    <Form.Item name='label' label='Nombre' rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name='itemsLabel' label='Qrs por fila' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='yAlign' label='Alineación vertical' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='xAlignBase' label='Alineación horizontal base' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='xAlignFactor' label='Alineación horizontal factor' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='fontSize' label='Tamaño de fuente' rules={[{ required: true }, { pattern: /^[0-9],(1[0-9]|24|[0-9])$/ }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name='qrSize' label='Tamaño de QR' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='qrYAlign' label='Alineación vertical QR' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item name='maxLength' label='Longitud máxima' rules={[{ required: true }]}>
                        <InputNumber />
                    </Form.Item>
                </Form>
            </Modal>

            <Dropdown menu={{ items: itemsPrinter }} >
                <Button type='primary' icon={<PrinterOutlined />} onClick={() => printPdf()} size='large' />
            </Dropdown>

        </div>
    </div>
}
