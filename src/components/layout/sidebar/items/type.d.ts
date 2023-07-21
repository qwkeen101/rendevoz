export type ISidebarItem = {
  id: number;
} & (
  | {
      draggable?: true | undefined;
      parentId: number;
      parentType: "whiteboard" | "collection";
    }
  | {
      draggable?: false | undefined;
      parentId: never;
      parentType: never;
    }
);
