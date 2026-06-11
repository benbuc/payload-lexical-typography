"use client";

import { type ToolbarGroup, type ToolbarGroupItem } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import {
  $getNodeByKey,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
  type BaseSelection,
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@payloadcms/richtext-lexical/lexical/selection";

import { useEffect } from "react";

import { TEXT_SIZE_COMMAND } from "./command";
import { Dropdown } from "./components/TextSizeDropdown";
import { TextSizeIcon } from "./components/TextSizeIcon";

import { getSelection } from "../../utils/getSelection";

export type TextSizeFeatureProps = {
  hideAttribution?: boolean;
  sizes?: { value: string; label: string }[];
  method?: "replace" | "combine";
  customSize?: boolean;
  scroll?: boolean;
};

export type TextSizeItem = ToolbarGroupItem & {
  command: Record<string, unknown>;
  current: () => string | null;
} & TextSizeFeatureProps;

export const TextSizeClientFeature = createClientFeature<TextSizeFeatureProps, TextSizeItem>(({ props }) => {
  const DropdownComponent: ToolbarGroup = {
    type: "dropdown",
    ChildComponent: TextSizeIcon,
    isEnabled({ selection }: { selection: BaseSelection }) {
      return !!getSelection(selection);
    },
    items: [
      {
        Component: () => {
          const [editor] = useLexicalComposerContext();
          return Dropdown({
            editor,
            item: {
              command: TEXT_SIZE_COMMAND,
              current() {
                const selection = getSelection();
                return selection ? $getSelectionStyleValueForProperty(selection, "font-size", "") : null;
              },
              hideAttribution: props?.hideAttribution,
              sizes: props?.sizes,
              method: props?.method,
              scroll: props?.scroll,
              customSize: props?.customSize,
              key: "textSize",
            },
          });
        },
        key: "textSize",
      },
    ],
    key: "textSizeDropdown",
    order: 60,
  };

  return {
    plugins: [
      {
        Component: () => {
          const [editor] = useLexicalComposerContext();

          useEffect(() => {
            const unregisterMutation = editor.registerMutationListener(TextNode, (mutatedNodes) => {
              editor.getEditorState().read(() => {
                for (const [nodeKey, mutation] of mutatedNodes) {
                  if (mutation === "destroyed") continue;
                  const node = $getNodeByKey(nodeKey);
                  const dom = editor.getElementByKey(nodeKey);
                  if (!node || !dom || !$isTextNode(node)) continue;

                  const style = node.getStyle();
                  const match = /(?:^|;)\s?font-size: ([^;]+)/.exec(style);
                  const fontSize = match ? match[1].trim() : "";

                  if (fontSize) {
                    dom.style.fontSize = fontSize;
                  } else {
                    dom.style.removeProperty("font-size");
                  }
                }
              });
            });

            const unregisterCommand = editor.registerCommand(
              TEXT_SIZE_COMMAND,
              (payload) => {
                editor.update(() => {
                  const selection = getSelection();
                  if (selection) {
                    $patchStyleText(selection, { "font-size": payload.size || "" });
                  }
                });
                return true;
              },
              COMMAND_PRIORITY_CRITICAL,
            );

            return () => {
              unregisterMutation();
              unregisterCommand();
            };
          }, [editor]);

          return null;
        },
        position: "normal",
      },
    ],
    toolbarFixed: {
      groups: [DropdownComponent],
    },
    toolbarInline: {
      groups: [DropdownComponent],
    },
  };
});
