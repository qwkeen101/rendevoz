export type IMenuLayoutItem = { key: string; label?: string; icon?: string; onClick?: () => void; children?: IMenuLayoutItem[] }
export const Menu = (props: any) => <div {...props}>{props.children}</div>
