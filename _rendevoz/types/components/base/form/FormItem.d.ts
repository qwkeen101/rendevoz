import { CSSProperties, FC, ReactNode } from 'react';
type FormItemConditionalProps = {
    disable?: boolean;
} & ({
    onChange?: (value: string) => void;
    text: string;
    type: 'input' | 'textarea';
    onUpload?: never;
    children?: never;
    value?: string;
    maxRows?: number;
    maxLength?: number;
    minRows?: number;
    minLength?: number;
    autoFocus?: boolean;
} | {
    type: 'file';
    onChange?: never;
    text?: never;
    onUpload: (file: File) => void;
    children?: never;
    value?: string;
} | {
    type: 'colorPicker';
    onChange?: (color: string) => void;
    text?: string;
    onUpload?: never;
    children?: never;
    value?: string;
} | {
    type: 'component';
    onChange?: never;
    text?: string;
    onUpload?: never;
    children: ReactNode;
    value?: string;
});
interface FormItemCommonProps {
    type: 'input' | 'textarea' | 'file' | 'colorPicker' | 'component';
    requireMessage?: string;
    required?: boolean;
    style?: CSSProperties;
}
type FormItemProps = FormItemCommonProps & FormItemConditionalProps;
declare const FormItem: FC<FormItemProps>;
export default FormItem;
