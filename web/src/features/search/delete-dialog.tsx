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


import { IconAlertTriangle } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { delete_messages } from '@/api/mailbox/envelope/api'
import { useSearchContext } from './context'
import { mapToRecordOfArrays } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnvelopeDeleteDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { toDelete, setToDelete, setSelected } = useSearchContext()
  const deleteMutation = useMutation({
    mutationFn: ({ payload }: { payload: Record<string, number[]> }) => delete_messages(payload),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-messages'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['all-tags'] });
      onOpenChange(false);
      setToDelete(new Map());
      setSelected(new Map());
      toast({
        title: 'Messages deleted successfully',
        description: 'The messages have been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete messages',
        description: `${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    const payload = mapToRecordOfArrays(toDelete);
    deleteMutation.mutate({ payload })
  }

  const isLoading = deleteMutation.isPending

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      className="max-w-xl"
      isLoading={isLoading}
      title={
        <span className='text-destructive'>
          <IconAlertTriangle
            className='mr-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Email
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>
              {(() => {
                const emailCount = Array.from(toDelete.values())
                  .reduce((sum, set) => sum + set.size, 0);
                return emailCount > 1 ? `this ${emailCount} emails` : 'this email';
              })()}
            </span>{' '}
            ?
            <br />
            This action will delete the selected email(s) from local database. the email(s) will be permanently deleted, and cannot be recovered.
          </p>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be cautious before proceeding.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
