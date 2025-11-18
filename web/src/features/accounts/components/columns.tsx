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


import { ColumnDef } from '@tanstack/react-table'
import LongText from '@/components/long-text'

import { AccountModel } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'
import { OAuth2Action } from './oauth2-action'
import { RunningStateCellAction } from './running-state-action'
import { EnableAction } from './enable-action'

export const columns: ColumnDef<AccountModel>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => {
      return <LongText>{row.original.id}</LongText>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => {
      return <LongText>{row.original.email}</LongText>
    },
    enableHiding: false,
  },
  {
    accessorKey: "enabled",
    header: ({ column }) => (
      <DataTableColumnHeader className="ml-4" column={column} title='Enabled' />
    ),
    cell: EnableAction,
    meta: { className: 'w-8 text-center' },
    enableHiding: false,
  },
  {
    id: 'auth_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Auth' />
    ),
    cell: OAuth2Action,
    meta: { className: 'w-8' },
    enableHiding: false,
    enableSorting: false
  },
  {
    id: 'account_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      return <LongText>{row.original.account_type}</LongText>
    },
    meta: { className: 'w-8' },
    enableHiding: false,
    enableSorting: false
  },
  {
    accessorKey: "sync_interval_sec",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Inc Sync' />
    ),
    cell: ({ row }) => {
      let account_type = row.original.account_type;
      if (account_type === "NoSync") {
        return <LongText className='max-w-12'>n/a</LongText>
      }
      return <LongText className='max-w-12'>{row.original.sync_interval_min} minutes</LongText>
    },
    meta: { className: 'w-12 text-center' },
    enableHiding: false,
  },
  {
    id: 'running_state',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='State' />
    ),
    cell: RunningStateCellAction,
    meta: { className: 'w-36' },
    enableHiding: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const created_at = row.original.created_at;
      const date = format(new Date(created_at), 'yyyy-MM-dd HH:mm:ss');
      return <LongText className='max-w-36'>{date}</LongText>;
    },
    meta: { className: 'w-36' },
    enableHiding: false,
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Updated At' />
    ),
    cell: ({ row }) => {
      const updated_at = row.original.updated_at;
      const date = format(new Date(updated_at), 'yyyy-MM-dd HH:mm:ss');
      return <LongText className='max-w-36'>{date}</LongText>;
    },
    meta: { className: 'w-36' },
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
