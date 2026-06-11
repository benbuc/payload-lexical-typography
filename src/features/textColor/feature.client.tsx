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

import { TEXT_COLOR_COMMAND } from "./command";
import { TextColorDropdown } from "./components/TextColorDropdown";
import { TextColorIcon } from "./components/TextColorIcon";

import { getSelection } from "../../utils/getSelection";

export type TextColorFeatureProps = {
  colors?: string[] | { value: string; label: string }[];
  colorPicker?: boolean;
  hideAttribution?: boolean;
  listView?: boolean;
};

export type TextColorItem = ToolbarGroupItem & {
  command: Record<string, unknown>;
  current: () => string | null;
} & TextColorFeatureProps;

export const TextColorClientFeature = createClientFeature<TextColorFeatureProps, TextColorItem>(
  ({ props }) => {
    const colors =
      props?.colors && props?.colors.length > 0
        ? props.colors
        : ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];

    const DropdownComponent: ToolbarGroup = {
      type: "dropdown",
      ChildComponent: TextColorIcon,
      isEnabled({ selection }: { selection: BaseSelection }) {
        return !!getSelection(selection);
      },
      items: [
        {
          Component: () => {
            const [editor] = useLexicalComposerContext();
            return TextColorDropdown({
              editor,
              item: {
                command: TEXT_COLOR_COMMAND,
                current() {
                  const selection = getSelection();
                  return selection ? $getSelectionStyleValueForProperty(selection, "color", "") : null;
                },
                colors,
                listView: props?.listView,
                hideAttribution: props?.hideAttribution,
                colorPicker: props?.colorPicker,
                key: "textColor",
              },
            });
          },
          key: "textColor",
        },
      ],
      key: "textColorDropdown",
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
                    const match = /(?:^|;)\s?color: ([^;]+)/.exec(style);
                    const color = match ? match[1].trim() : "";

                    if (color) {
                      dom.style.color = color;
                    } else {
                      dom.style.removeProperty("color");
                    }
                  }
                });
              });

              const unregisterCommand = editor.registerCommand(
                TEXT_COLOR_COMMAND,
                (payload) => {
                  editor.update(() => {
                    const selection = getSelection();
                    if (selection) {
                      $patchStyleText(selection, { color: payload.color || "" });
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
  },
);
