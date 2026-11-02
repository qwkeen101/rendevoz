import React, { forwardRef } from 'react'
export const Icon = (props: any) => <span {...props}>{props.children || props.name || 'icon'}</span>
export const Button = (props: any) => <button {...props}>{props.children}</button>
export const BetterInput = forwardRef<HTMLInputElement, any>((props, ref) => <input ref={ref} {...props} />)
export const WithBorder = (props: any) => (
  <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: 4, ...(props.style || {}) }} {...props}>
    {props.children}
  </div>
)
export const Content = (props: any) => <div {...props}>{props.children}</div>
export const Menu = (props: any) => <div {...props}>{props.children}</div>
export const IconWithPopover = Icon
export const AnimatePopover = (props: any) => <div {...props}>{props.children}</div>
export const ColorPicker = (props: any) => <div {...props}>{props.children}</div>
export const Tooltip = (props: any) => <span {...props}>{props.children}</span>
export const ToolbarV2 = (props: any) => <div {...props}>{props.children}</div>
export const IconButton = Button
export const Switch = (props: any) => <input type="checkbox" {...props} />
export const AutosizeTextarea = (props: any) => <textarea {...props} />
export const Tabs = (props: any) => <div {...props}>{props.children}</div>
export const TabPane = (props: any) => <div {...props}>{props.children}</div>
export const Tab = (props: any) => <div {...props}>{props.children}</div>
export const TooltipButton = Button
export const ContentPanel = Content
export default {
  Icon,
  Button,
  BetterInput,
  WithBorder,
  Content,
  Menu,
  IconWithPopover,
  AnimatePopover,
  ColorPicker,
  Tooltip,
  ToolbarV2,
  IconButton,
  Switch,
  AutosizeTextarea,
  Tabs,
  TabPane,
  Tab,
  TooltipButton,
  ContentPanel
}
