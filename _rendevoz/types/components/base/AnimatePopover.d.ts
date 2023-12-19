import React, { Dispatch, PropsWithChildren, ReactNode, RefObject } from 'react';
import { PopoverProps } from 'react-tiny-popover';
import { Position } from '~/typings';
import { SetStateAction } from 'jotai';
export interface AnimatePopoverProps extends Omit<PopoverProps, 'content' | 'isOpen' | 'children'> {
    animate?: boolean;
    visible?: boolean;
    content: React.ReactNode | ((setVisible: Dispatch<SetStateAction<boolean>>) => ReactNode);
    disableNudge?: boolean;
    disableIntersection?: boolean;
    onVisiblityChange?: (v: boolean) => void;
    innerRef?: RefObject<HTMLElement>;
    parentElement?: HTMLElement | null;
    backdropFilter?: boolean;
    position?: Position;
    children?: ReactNode;
    contentDraggable?: boolean;
    closeOnClickOutside?: boolean;
    withClickCover?: boolean;
    borderRadius?: number;
    duration?: number;
    hoverOpen?: boolean;
}
declare const _default: import("react").NamedExoticComponent<PropsWithChildren<AnimatePopoverProps>>;
export default _default;
