import { CSSProperties, FC } from 'react';
interface ReadMoreProps {
    textLength?: number;
    children: React.ReactNode;
    style?: CSSProperties;
}
declare const ReadMore: FC<ReadMoreProps>;
export default ReadMore;
