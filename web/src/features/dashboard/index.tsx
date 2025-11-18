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


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Mail, HardDrive, Database, Users, Inbox } from 'lucide-react';
import { formatBytes, formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { get_dashboard_stats, TimeBucket } from '@/api/system/api';
import { Main } from '@/components/layout/main';
import { FixedHeader } from '@/components/layout/fixed-header';

interface DailyActivity {
  date: string;
  count: number;
}

function convertRecentActivity(timeBuckets: TimeBucket[]): DailyActivity[] {
  return timeBuckets.map(bucket => {
    const date = new Date(bucket.timestamp_ms);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return {
      date: `${mm}-${dd}`,
      count: bucket.count,
    };
  });
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Skeleton Components
const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <div className="h-80 w-full flex items-center justify-center">
    <div className="space-y-2 w-full px-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

// Empty State Components
const EmptyChart = ({ title }: { title: string }) => (
  <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
    <Inbox className="h-12 w-12 mb-3 opacity-40" />
    <p className="text-sm font-medium">{title}</p>
  </div>
);

const EmptyTable = ({ title }: { title: string }) => (
  <div className="py-10 text-center text-muted-foreground">
    <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
    <p className="text-sm font-medium">{title}</p>
  </div>
);

export default function MailArchiveDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: get_dashboard_stats,
  });

  // 计算附件比例
  const totalAttachments = (stats?.with_attachment_count ?? 0) + (stats?.without_attachment_count ?? 0);
  const attachmentRatio = totalAttachments > 0 ? (stats?.with_attachment_count ?? 0) / totalAttachments : 0;

  // 空状态判断
  const hasRecentActivity = stats?.recent_activity && stats.recent_activity.length > 0;
  const hasTopSenders = stats?.top_senders && stats.top_senders.length > 0;
  const hasTopEmails = stats?.top_largest_emails && stats.top_largest_emails.length > 0;
  const hasTopAccounts = stats?.top_accounts && stats.top_accounts.length > 0;

  // 附件饼图数据（空时显示“无数据”）
  const attachmentData = totalAttachments > 0
    ? [
      { name: 'With Attachments', value: attachmentRatio, fill: COLORS[1] },
      { name: 'No Attachments', value: 1 - attachmentRatio, fill: '#e5e7eb' },
    ]
    : [
      { name: 'No Data', value: 1, fill: '#e5e7eb' },
    ];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <FixedHeader />
      <Main higher>
        <div className="flex-1 space-y-6 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
          </div>

          {/* Core Metric Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mail Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats!.account_count)}</div>
                <p className="text-xs text-muted-foreground">Connected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats!.email_count)}</div>
                <p className="text-xs text-muted-foreground">Synced locally</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Email Size</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats!.total_size_bytes)}</div>
                <p className="text-xs text-muted-foreground">Logical volume</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Local Data Files</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats!.storage_usage_bytes)}</div>
                <p className="text-xs text-muted-foreground">Actual disk usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Index Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats!.index_usage_bytes)}</div>
                <p className="text-xs text-muted-foreground">Tantivy index</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="trend" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="trend">30-Day Trend</TabsTrigger>
              <TabsTrigger value="attachment">Attachments</TabsTrigger>
              <TabsTrigger value="top">Top Lists</TabsTrigger>
            </TabsList>

            {/* 30-Day Trend */}
            <TabsContent value="trend" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>New Emails</CardTitle>
                  <CardDescription>Message distribution</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {hasRecentActivity ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={convertRecentActivity(stats!.recent_activity)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(v) => formatNumber(v as number)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart title="No recent activity" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments */}
            <TabsContent value="attachment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attachment Ratio</CardTitle>
                  <CardDescription>
                    {totalAttachments > 0
                      ? `${(attachmentRatio * 100).toFixed(1)}% of emails have attachments`
                      : 'No emails synced yet'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-80">
                  <ResponsiveContainer width={300} height={300}>
                    <PieChart>
                      <Pie
                        data={attachmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {attachmentData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => totalAttachments > 0 ? `${((v as number) * 100).toFixed(1)}%` : '0%'} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="ml-8 space-y-2">
                    {totalAttachments > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-sm">
                            With Attachments ({(attachmentRatio * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gray-200"></div>
                          <span className="text-sm">No Attachments</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-200"></div>
                        <span className="text-sm">No Data</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Lists */}
            <TabsContent value="top" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* Top 10 Senders */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 10 Senders</CardTitle>
                    <CardDescription>By message count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasTopSenders ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sender</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats!.top_senders.map((s) => (
                            <TableRow key={s.key}>
                              <TableCell className="font-medium max-w-[180px] truncate" title={s.key}>
                                {s.key}
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyTable title="No senders data" />
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 Largest Emails */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 10 Largest Emails</CardTitle>
                    <CardDescription>By message size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasTopEmails ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats!.top_largest_emails.map((m, index) => (
                            <TableRow key={index}>
                              <TableCell
                                className="max-w-[180px] truncate font-medium"
                                title={m.subject}
                              >
                                {m.subject || '(No Subject)'}
                              </TableCell>
                              <TableCell className="text-right">{formatBytes(m.size_bytes)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyTable title="No large emails" />
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 Accounts */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 10 Accounts</CardTitle>
                    <CardDescription>By message count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasTopAccounts ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Emails</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats!.top_accounts.map((acc) => (
                            <TableRow key={acc.key}>
                              <TableCell className="font-medium max-w-[160px] truncate" title={acc.key}>
                                {acc.key}
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(acc.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyTable title="No account data" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  );
}