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


import { useState } from 'react'
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AccountModel } from '../data/schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ToastAction } from '@/components/ui/toast'
import { AxiosError } from 'axios'
import { remove_account } from '@/api/account/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: AccountModel
}

export function AccountDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')

  const queryClient = useQueryClient();
  function handleSuccess() {
    toast({
      title: 'Account Deleted',
      description: 'Your account has been successfully deleted.',
      action: <ToastAction altText="Close">Close</ToastAction>,
    });

    queryClient.invalidateQueries({ queryKey: ['account-list'] });
    onOpenChange(false);
  }

  function handleError(error: AxiosError) {
    const errorMessage = error.response?.data ||
      error.message ||
      `Delete failed, please try again later`;

    toast({
      variant: "destructive",
      title: `Account delete Failed`,
      description: errorMessage as string,
      action: <ToastAction altText="Try again">Try again</ToastAction>,
    });
    console.error(error);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove_account(id),
    onSuccess: handleSuccess,
    onError: handleError
  })

  const handleDelete = () => {
    if (value.trim() !== currentRow.email) return
    deleteMutation.mutate(currentRow.id)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.email}
      className="max-w-2xl"
      title={
        <span className='text-destructive'>
          <IconAlertTriangle
            className='mr-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Account Permanently
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            You are deleting <span className='font-bold'>{currentRow.email}</span>.
            This will permanently remove:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Account credentials and settings</li>
            <li>Local cached metadata and sync status</li>
            <li>IMAP synchronization data</li>
            <li>OAuth tokens and API credentials</li>
          </ul>

          <div className="pt-2">
            <Label>
              Type the account email to confirm:
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Type "${currentRow.email}" to confirm`}
                className="mt-2"
              />
            </Label>
          </div>

          <Alert variant='destructive'>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>This action cannot be undone!</AlertTitle>
            <AlertDescription>
              All related resources will be permanently erased.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={
        deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete Account'
      }
      isLoading={deleteMutation.isPending}
      destructive
    />
  )
}
