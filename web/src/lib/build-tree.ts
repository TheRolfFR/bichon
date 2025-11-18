//
// Copyright (c) 2025 rustmailer.com (https://rustmailer.com)
//
// This file is part of the Bichon Email Archiving Project
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


import { MailboxData } from "@/api/mailbox/api";
import { TreeDataItem } from "@/components/tree-view";
import { Badge } from '@/components/ui/badge'
import { FolderClosed, FolderOpen } from "lucide-react";
import React from 'react';

type BadgeContentFunction = (item: MailboxData) => React.ReactNode;

export const buildTree = (data: MailboxData[], badgeContent?: BadgeContentFunction, showAttributes?: boolean, showExists?: boolean): TreeDataItem[] => {
    const root: TreeDataItem = {
        id: 'root',
        name: 'Root',
        icon: FolderClosed,
        openIcon: FolderOpen,
        children: [], // Ensure children is initialized as an array
    };

    const nodeMap: { [key: string]: TreeDataItem } = {};
    data.sort((a, b) => a.name.localeCompare(b.name));
    data.forEach((item) => {
        const { id, name, delimiter, exists, attributes } = item;
        const badge = showExists ? (badgeContent ? badgeContent(item) : React.createElement(Badge, {
            className: 'text-[12px]',
            variant: 'secondary',
        }, exists)) : null;

        const attributesNode = showAttributes
            ? attributes.map((item, index) =>
                React.createElement(
                    Badge,
                    {
                        key: index,
                        className: 'text-[12px] mr-1 last:mr-0',
                        variant: 'secondary',
                    },
                    item.attr === 'Extension' ? item.extension || '' : item.attr
                )
            )
            : null;
        // const badge = badgeContent || React.createElement(Badge, {
        //     className: 'text-xs',
        // }, exists);
        // If there is no delimiter, add the item directly as a child of the root
        if (!delimiter) {
            root.children!.push({
                id: id.toString(),
                name,
                icon: FolderClosed,
                openIcon: FolderOpen,
                badge,
                attributes: showAttributes ? attributesNode : null,
                children: undefined, // Leaf node, so children is undefined
            });
            return;
        }

        // Split the name into parts based on the delimiter
        const parts = name.split(delimiter); // dir/sub1/sub2
        let currentParent = root;

        // Traverse or create nodes for each part of the path
        parts.forEach((part, index) => {
            const path = parts.slice(0, index + 1).join(delimiter);

            // If the node already exists, set it as the current parent
            if (nodeMap[path]) {
                currentParent = nodeMap[path];
            } else {
                // Determine if this is a leaf node (last part of the path)
                const isLeaf = index === parts.length - 1;

                // Create a new node
                const newNode: TreeDataItem = {
                    id: isLeaf ? id.toString() : path, // Use item.id for leaf nodes, path for non-leaf nodes
                    name: part,
                    icon: FolderClosed,
                    openIcon: FolderOpen,
                    badge,
                    attributes: showAttributes ? attributesNode : null,
                    children: isLeaf ? undefined : [], // Ensure children is initialized as an array for non-leaf nodes
                };

                // Ensure currentParent.children is initialized as an array
                if (!currentParent.children) {
                    currentParent.children = [];
                }

                // Add the new node to the current parent's children
                currentParent.children.push(newNode);
                currentParent = newNode; // Update the current parent to the new node
                nodeMap[path] = newNode; // Store the node in the map for quick lookup
            }
        });
    });

    // Return the children of the root as the final tree structure
    return root.children!;
};