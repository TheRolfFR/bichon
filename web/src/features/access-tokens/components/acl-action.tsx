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


import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useAccessTokensContext } from '../context'
import { AccessToken } from '../data/schema'
import { MoreHorizontal } from 'lucide-react'

interface DataTableRowActionsProps {
  row: Row<AccessToken>
}

export function AclCellAction({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useAccessTokensContext()
  return (
    <Button variant='ghost' onClick={() => {
      if (row.original.acl) {
        setCurrentRow(row.original)
        setOpen('acl-detail')
      }
    }}>
      {row.original.acl ? <MoreHorizontal className='h-4 w-4' /> : <span className='text-xs'>n/a</span>}
    </Button>
  )
}
