import { Content } from "@/components";
import { useDebounceFn, useGlobalAtom } from "@/hooks";
import {
  ISearchResultItem,
  SearchableDocument,
  SearchStore,
} from "@/stores/search.store";
import { css } from "@emotion/css";
import { atom } from "jotai";
import { useEffect } from "react";
import SearchResultItem from "./SearchResultItem";
import BorderInput from "@/components/base/BorderInput";
import ClassName from "@/styles/classNames";
import { useTranslation } from "react-i18next";
import FontSize from "@/consts/font";
import { globalStore, MetaStore } from "@/stores";
import { getObjectById } from "@/stores/object.store";
import { metaObjectsAtom } from "@/stores/meta.store";

export const GlobalSearchInputAtom = atom<string>("");

export type SearchGroup = {
  metaId: number;
  highlightName?: string;
  highlightDescription?: string;
  items: (SearchableDocument & {
    positions?: ISearchResultItem["positions"];
  })[];
};
export type SearchGroupMap = Map<number, SearchGroup>;
export const GlobalSearchResultsAtom = atom<SearchGroupMap>(new Map());

export const SearchDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const [searchInput, setSearchInput] = useGlobalAtom(GlobalSearchInputAtom);
  const [searchResults, setSearchResults] = useGlobalAtom(
    GlobalSearchResultsAtom
  );
  const { t } = useTranslation();
  const { run: debouncedSearch } = useDebounceFn(
    () => {
      if (searchInput.length) {
        Promise.all([
          SearchStore.searchDocument({
            query: searchInput,
            specType: "metaObject",
          }),
          SearchStore.searchDocument({
            query: searchInput,
            specType: "all",
          }),
        ]).then((result) => {
          // put pdf page -> pdf, note block -> note
          const groupedMap = new Map() as SearchGroupMap;
          const deletedIds: number[] = [];
          const addToMap = async (item: ISearchResultItem) => {
            const { doc } = item;

            let metaId: number | undefined = undefined;
            if (doc.specType === "metaObject") metaId = Number(doc.id);
            else {
              const targetObjectId = Number(doc.targetObjectId);
              const object = await getObjectById(targetObjectId);
              if (object) {
                if ("specType" in object) {
                  if (object.specType === "pdf") {
                    const pdfMeta = MetaStore.getMetaObjectByObjectId(
                      object.id
                    );
                    if (pdfMeta) {
                      metaId = pdfMeta.id;
                      console.log(pdfMeta);
                    }
                  }
                  if (object.specType === "note") {
                    const noteTargetMetaId = object.metaId;
                    if (noteTargetMetaId) {
                      const noteTargetMeta = await MetaStore.getMetaObjectById(
                        noteTargetMetaId
                      );
                      if (noteTargetMeta) {
                        metaId = noteTargetMeta.id;
                        console.log(noteTargetMeta);
                      }
                    } else {
                      const noteMeta = MetaStore.getMetaObjectByObjectId(
                        object.id
                      );
                      if (noteMeta) {
                        console.log(noteMeta);
                        metaId = noteMeta.id;
                      }
                    }
                  }
                }
              }
            }

            if (!metaId) {
              deletedIds.push(Number(doc.id));
              return;
            }
            const numberMetaId = Number(metaId);
            console.log(numberMetaId);
            const group = groupedMap.get(numberMetaId) || {
              items: [],
              metaId: numberMetaId,
            };
            if (doc.specType === "metaObject") {
              group.highlightName = doc.name;
              group.highlightDescription = doc.content;
            }
            if (doc.specType !== "metaObject") {
              const arr = group.items;
              arr.push({
                ...item.doc,
                positions: item.positions,
              });
            }
            groupedMap.set(numberMetaId, group);
          };
          Promise.all([...result[1].map((item) => addToMap(item))]).then(() => {
            Promise.all([...result[0].map((item) => addToMap(item))]).then(
              () => {
                console.log(groupedMap);
                const metaObjects = globalStore.get(metaObjectsAtom);
                groupedMap.forEach((i, k) => {
                  if (!metaObjects.has(i.metaId)) {
                    groupedMap.delete(k);
                  }
                });
                setSearchResults(groupedMap);
                if (deletedIds.length) {
                  SearchStore.deleteDocuments(deletedIds);
                }
              }
            );
          });
        });
      }
    },
    { wait: 50 }
  );

  useEffect(() => {
    debouncedSearch();
  }, [searchInput]);

  return (
    <Content
      flex
      column
      gap={10}
      className={css([
        {
          width: 1100,
          padding: "12px 24px 0px",
          borderRadius: 10,
          maxWidth: "calc(100vw - 200px)",
          height: "85vh",
          "*": {
            textTransform: "none",
          },
          em: {
            color: "yellow",
            fontStyle: "normal",
          },
        },
        ClassName.Background.pseudoBlurContrastBackground,
      ])}
    >
      <div className={ClassName.title(FontSize["16px"])}>
        {t("general.search entire knowledge base")}
      </div>
      <BorderInput
        textarea={false}
        id="global-search-input"
        placeholder={t(
          "general.search text content in pdfs, web pages, notes, etc."
        )}
        value={searchInput}
        onChange={(e) => setSearchInput(e)}
        autoFocus
        style={{
          padding: "10px 16px",
        }}
      />
      {/* <SearchAnalysis /> */}
      <Content
        flex
        column
        style={{
          height: 0,
          flex: 1,
          overflowY: "auto",
          padding: "0px 30px 20px",
          margin: "0px -20px",
        }}
      >
        {Array.from(searchResults.values())
          .sort((b, a) => {
            if (b.highlightName && !a.highlightName) {
              return -1;
            }
            if (a.highlightName && !b.highlightName) {
              return 1;
            }
            return 0;
          })
          .map((i) => (
            <SearchResultItem key={i.metaId} group={i} onNavi={onClose} />
          ))}
      </Content>
    </Content>
  );
};
