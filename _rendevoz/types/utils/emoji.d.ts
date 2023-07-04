export type Emoji = {
    name: string;
    unified: string;
    non_qualified: string;
    image: string;
    sheet_x: number;
    sheet_y: number;
    short_name: string;
    short_names: string[];
    category: string;
    sort_order: number;
};
export declare const getEmoji: (name: string) => {
    x: number;
    y: number;
    imageSrc: any;
    name: string;
};
export default getEmoji;
