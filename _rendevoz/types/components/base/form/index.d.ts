import { CSSProperties, FC } from "react";
import FormItem from "./FormItem";
interface FormProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    onBack?: () => void;
    onSubmit?: () => void;
    style?: CSSProperties;
    submitText?: string;
    backText?: string;
    extra?: React.ReactNode;
}
interface IForm extends FC<FormProps> {
    Item: typeof FormItem;
}
declare const Form: IForm;
export default Form;
