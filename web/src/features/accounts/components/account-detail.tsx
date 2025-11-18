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


import { AccountModel } from '../data/schema'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: AccountModel
}

export function AccountDetailDrawer({ open, onOpenChange, currentRow }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-5xl'>
        <DialogHeader className='text-left mb-4'>
          <DialogTitle>{currentRow.email}</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[35rem] w-full pr-4 -mr-4 py-1">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="account">Account Details</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <div className="mt-4 space-y-6">
                {/* Account Details Card */}
                <Card>
                  <CardContent className="mt-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">ID:</span>
                        <span>{currentRow.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{currentRow.email}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{currentRow.name ?? "n/a"}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Enabled:</span>
                        <Checkbox checked={currentRow.enabled} disabled />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Incremental Sync Interval:</span>
                        <span>every {currentRow.sync_interval_min} minutes</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-muted-foreground">Capabilities:</span>
                        <code className="rounded-md bg-muted/50 px-2 py-1 text-sm border overflow-x-auto inline-block">
                          {currentRow.capabilities ? currentRow.capabilities.join(", ") : "n/a"}
                        </code>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Date Selection:</span>
                        <span>
                          {currentRow.date_since?.fixed
                            ? currentRow.date_since.fixed
                            : currentRow.date_since?.relative
                              ? `recent ${currentRow.date_since.relative.value} ${currentRow.date_since.relative.unit}`
                              : "n/a"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Folder Limit:</span>
                        <span>{currentRow.folder_limit ? currentRow.folder_limit : "n/a"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Server Configuration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Server Configuration (IMAP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{currentRow.imap?.host}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Port:</span>
                        <span>{currentRow.imap?.port}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Encryption:</span>
                        <span>{currentRow.imap?.encryption}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Auth:</span>
                        {currentRow.imap?.auth.auth_type === "OAuth2" ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            OAuth2
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Password
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Use Proxy:</span>
                        <span>{currentRow.imap?.use_proxy ? "true" : "false"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sync Folders Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sync Folders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentRow.sync_folders?.length ? (
                      <div className="space-y-2">
                        <div className="text-sm mt-2 text-muted-foreground">
                          {currentRow.sync_folders.length} folder(s) configured for sync
                        </div>
                        <ScrollArea className="h-[300px] rounded-md border">
                          <div className="p-2">
                            {currentRow.sync_folders.map((folder, index) => (
                              <div
                                key={index}
                                className="flex items-center py-2 px-3 hover:bg-accent rounded-md transition-colors"
                              >
                                <span className="text-sm font-medium">{folder}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No folders configured for sync
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}