import { CSSProperties, FC, MouseEventHandler } from 'react';
interface ModalProps {
    visible: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    width?: number | string;
    height?: number | string;
    onClose: () => void;
    onClick?: MouseEventHandler;
    children: React.ReactNode;
    parentElement?: HTMLElement | null;
    noStyle?: boolean;
    style?: CSSProperties;
    zIndex?: number;
    showClose?: boolean;
    notUnmount?: boolean;
}
declare const Modal: FC<ModalProps>;
export default Modal;
