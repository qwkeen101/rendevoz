import { cloneElement, ReactNode } from "react";
import { CustomElement } from "../../../../../typings/editor/types";
import EmbeddedCard from "./EmbeddedCard";
import LineCard from "./LineCard";
import SlimCard from "./SlimCard";
import WideCard from "./WideCard";

const NoteCard = ({
  children,
  main,
  pictureUrl,
  type,
  noteId,
  element,
}: {
  children: ReactNode;
  main: ReactNode;
  pictureUrl?: string;
  noteId?: number;
  type?: "note" | "pdf";
  element: CustomElement & { cardType?: string };
}) => {
  let card;
  const cardType = element?.cardType || "line";
  switch (cardType) {
    case "slim":
      card = <SlimCard />;
      break;
    case "wide":
      card = <WideCard />;
      break;
    case "line":
      card = <LineCard />;
      break;
    case "embedded":
      card = <EmbeddedCard />;
      break;
    default:
      card = <LineCard />;
  }
  return cloneElement(card, {
    slateChildren: children,
    main,
    pictureUrl,
    type,
    element,
    noteId,
  });
};

export default NoteCard;
