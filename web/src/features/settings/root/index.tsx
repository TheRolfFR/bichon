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


import ContentSection from '../components/content-section'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useMutation } from '@tanstack/react-query'
import { reset_root_token, reset_root_password } from '@/api/access-tokens/api'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { PasswordInput } from '@/components/password-input'
import { resetAccessToken, setAccessToken } from '@/stores/authStore'
import { BellRing } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'

const useResetRootToken = () =>
  useMutation({ mutationFn: reset_root_token, retry: 0 });

const useResetRootPassword = () =>
  useMutation({
    mutationFn: (password: string) => reset_root_password(password),
    retry: 0,
  });

export default function RootAccess() {
  const navigate = useNavigate()

  const [openToken, setOpenToken] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);

  const [newToken, setNewToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const tokenMutation = useResetRootToken();
  const passwordMutation = useResetRootPassword();

  const onConfirmToken = useCallback(() => {
    tokenMutation.mutate(undefined, {
      onSuccess: (data) => {
        setNewToken(data);
        setAccessToken(data);
        toast({
          title: "The root token has been reset",
          description: "Your login information has been updated. No need to log in again.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        });
        setOpenToken(false);
      },
    });
  }, [tokenMutation]);

  const onConfirmPassword = useCallback(() => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "The root password must be at least 6 characters long.",
        action: <ToastAction altText="Close">Close</ToastAction>,
      });
      return;
    }
    passwordMutation.mutate(newPassword, {
      onSuccess: () => {
        toast({
          title: "The root password has been reset",
          description: "Use the new password for your next login.",
          action: <ToastAction altText="Close">Close</ToastAction>,
        });
        setNewPassword("");
        setOpenPassword(false);
        resetAccessToken()
        navigate({ to: '/sign-in' })
      },
    });
  }, [newPassword, passwordMutation]);

  const onCopy = useCallback(async () => {
    if (newToken) {
      try {
        await navigator.clipboard.writeText(newToken);
        setIsCopied(true);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to copy text",
          description: (err as Error).message,
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      }
    }
  }, [newToken]);

  return (
    <ContentSection
      title="Root"
      desc="Manage root access credentials including token and password."
      showHeader={false}
    >
      <div className="flex justify-center w-full bg-muted/10 py-16">
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">Root Access Management</CardTitle>
            <CardDescription className="text-sm">
              Manage root token and password securely.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Reset Token */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Reset Root Token</p>
                  <p className="text-xs text-muted-foreground">
                    Generate new token, old one expires immediately.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenToken(true)}>
                Reset
              </Button>
            </div>

            <Separator />

            {/* Reset Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Reset Root Password</p>
                  <p className="text-xs text-muted-foreground">
                    Change password for future logins.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenPassword(true)}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirm dialogs */}
        <ConfirmDialog
          key="root-token-reset"
          destructive
          open={openToken}
          onOpenChange={setOpenToken}
          handleConfirm={onConfirmToken}
          className="max-w-lg"
          title="Reset Root Token"
          desc={
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to reset the root token. This action cannot be undone.
              </p>
              {newToken && (
                <div className="flex items-center space-x-2">
                  <PasswordInput value={newToken} readOnly className="w-full" />
                  <Button size="icon" variant="outline" onClick={onCopy}>
                    {isCopied ? (
                      <IconCheck className="h-5 w-5" />
                    ) : (
                      <IconCopy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          }
          confirmText="Confirm Reset"
          isLoading={tokenMutation.isPending}
        />

        <ConfirmDialog
          key="root-password-reset"
          destructive
          open={openPassword}
          onOpenChange={setOpenPassword}
          handleConfirm={onConfirmPassword}
          className="max-w-lg"
          title="Reset Root Password"
          desc={
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to reset the root password. Make sure to store it securely.
              </p>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new root password"
                className="w-full"
              />
            </div>
          }
          confirmText="Confirm Reset"
          isLoading={passwordMutation.isPending}
        />
      </div>

    </ContentSection>
  );
}
