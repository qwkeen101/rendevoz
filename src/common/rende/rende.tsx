import { createElement, ReactHTML } from "react";

type StringArray<T extends Readonly<string[]>> = T[number];

export const HtmlElements = [
  "a",
  "audio",
  "b",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "nav",
  "ol",
  "output",
  "p",
  "pre",
  "progress",
  "script",
  "section",
  "span",
  "strong",
  "table",
  "textarea",
  "th",
  "tr",
  "ul",
  "video",
] as const;
export type HTMLElements = StringArray<typeof HtmlElements>;
export type RendeComponents = {
  [K in HTMLElements]: ReactHTML[K];
};

const createRendeComponent = () => {
  const custom = (type: string) => (props: any) =>
    createElement(type, { ...props, onClick: () => console.log("this") });

  return new Proxy(custom, {
    get: (_target, key: string) => {
      return custom(key);
    },
  }) as typeof custom & RendeComponents;
};

export const rende = createRendeComponent();
