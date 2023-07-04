import { ReactNode } from 'react';
interface NotificationProps {
    title?: string | ReactNode;
    content?: string | ReactNode;
}
declare const Notification: ({ title, content }: NotificationProps) => JSX.Element;
export default Notification;
