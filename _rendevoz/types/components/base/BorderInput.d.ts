import { CSSProperties, HTMLProps } from 'react';
import { TextareaAutosizeProps } from '../custom/input/autosizeTextarea';
type BorderInputProps = {
    onChange?: (v: string) => void;
    placeholder?: string;
    style?: CSSProperties;
    defaultValue?: string;
    textarea?: boolean;
    containerStyle?: CSSProperties;
    autoFocus?: boolean;
    disable?: boolean;
    id?: string;
    withSubmit?: boolean;
    onSubmit?: VoidFunction;
    spellCheck?: 'false' | 'true';
} & (({
    textarea: true;
} & TextareaAutosizeProps) | {
    textarea: false;
}) & HTMLProps<HTMLInputElement>;
declare const BorderInput: ({ value, onChange, placeholder, style, defaultValue, textarea, autoFocus, spellCheck, disable, containerStyle, id, onSubmit, withSubmit, ...rest }: BorderInputProps) => import("react/jsx-runtime").JSX.Element;
export default BorderInput;
