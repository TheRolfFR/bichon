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


import { DatePicker } from "@/components/date-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Filter, RotateCcw } from "lucide-react";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { VirtualizedSelect } from "@/components/virtualized-select";
import useMinimalAccountList from "@/hooks/use-minimal-account-list";
import { useNavigate } from "@tanstack/react-router";
import { list_mailboxes, MailboxData } from "@/api/mailbox/api";
import { useQuery } from "@tanstack/react-query";
import { useSearchContext } from "./context";
import { toast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const searchFilterSchema = z.object({
    text: z.string().optional().or(z.literal("")),
    from: z
        .string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    to: z
        .string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    cc: z
        .string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    bcc: z
        .string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    has_attachment: z.boolean().optional(),
    attachment_name: z.string().optional().or(z.literal("")),
    since: z.date().optional(),
    before: z.date().optional(),
    account_id: z.number().optional().or(z.literal("")),
    mailbox_id: z.number().optional().or(z.literal("")),
    min_size: z.number().optional().or(z.literal("")),
    max_size: z.number().optional().or(z.literal("")),
    message_id: z.string().optional().or(z.literal("")),
});

type SearchFilterForm = z.infer<typeof searchFilterSchema>;


interface Props {
    onSubmit: (values: Record<string, any>) => void,
    isLoading: boolean,
    reset: () => void,
    open: boolean,
    onOpenChange: (open: boolean) => void;
}

const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (value === '') return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'number' && isNaN(value)) return true;
    if (value === false) return true;
    if (value === 0) return true;
    return false;
};

const cleanEmpty = <T extends Record<string, any>>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => !isEmptyValue(value))
    ) as Partial<T>;
};

export function SearchFormDialog({ onSubmit, isLoading, reset, open, onOpenChange }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
    const { accountsOptions, isLoading: accountsIsLoading } = useMinimalAccountList();
    const { selectedTags } = useSearchContext();

    const form = useForm<SearchFilterForm>({
        resolver: zodResolver(searchFilterSchema),
        defaultValues: {
            text: "",
            from: "",
            to: "",
            cc: "",
            bcc: "",
            attachment_name: "",
            message_id: "",
            min_size: undefined,
            max_size: undefined,
            has_attachment: false,
            since: undefined,
            before: undefined,
            account_id: undefined,
            mailbox_id: undefined,
        },
        mode: "onChange",
    });

    const navigate = useNavigate();
    const { data: mailboxes, isLoading: isMailboxesLoading } = useQuery({
        queryKey: ['search-account-mailboxes', `${selectedAccountId}`],
        queryFn: () => list_mailboxes(selectedAccountId!, false),
        enabled: !!selectedAccountId,
    })


    const mailboxesOptions = mailboxes?.map((mailbox: MailboxData) => ({
        value: mailbox.id.toString(),
        label: mailbox.name,
    })) || [];


    const handleSubmit = (values: Record<string, any>) => {
        let cleaned = cleanEmpty(values);
        if (selectedTags.length > 0) {
            cleaned.tags = selectedTags;
        }
        if (Object.keys(cleaned).length > 0) {
            onSubmit(cleaned);
        } else {
            toast({
                title: 'Please select at least one search condition',
            });
        }
    }

    const handleClear = () => {
        form.reset({
            text: "",
            from: "",
            to: "",
            cc: "",
            bcc: "",
            has_attachment: false,
            attachment_name: "",
            since: undefined,
            before: undefined,
            account_id: undefined,
            mailbox_id: undefined,
            min_size: undefined,
            max_size: undefined,
            message_id: "",
        });
        setSelectedAccountId(undefined);
    }

    return (<Sheet
        open={open}
        onOpenChange={onOpenChange}
    >
        <SheetContent className='w-full md:max-w-4xl mx-auto'>
            <SheetHeader className="p-4 pb-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                        Search Archived Emails
                    </SheetTitle>
                </div>
            </SheetHeader>
            <SheetDescription>
                Full-text · Multi-account · Advanced filters
            </SheetDescription>
            <Form {...form}>
                <form id="email-search-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="account_id"
                                render={({ field }) => (
                                    <FormItem className="min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <FormLabel className="text-xs whitespace-nowrap">Account:</FormLabel>
                                            <FormControl className="flex-1">
                                                <VirtualizedSelect
                                                    options={accountsOptions}
                                                    isLoading={accountsIsLoading}
                                                    onSelectOption={(values) => {
                                                        const account_id = parseInt(values[0], 10);
                                                        setSelectedAccountId(account_id);
                                                        field.onChange(account_id);
                                                    }}
                                                    value={field.value?.toString() ?? ""}
                                                    placeholder="Select account"
                                                    className="h-10 w-full"
                                                    noItemsComponent={
                                                        <div className="p-2">
                                                            <p className="text-xs">No active email account.</p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate({ to: "/accounts" })}
                                                            >
                                                                Add Email Account
                                                            </Button>
                                                        </div>
                                                    }
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mailbox_id"
                                render={({ field }) => (
                                    <FormItem className="min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <FormLabel className="text-xs whitespace-nowrap">Mailbox:</FormLabel>
                                            <FormControl className="flex-1">
                                                <VirtualizedSelect
                                                    options={mailboxesOptions}
                                                    isLoading={isMailboxesLoading}
                                                    onSelectOption={(values) => field.onChange(parseInt(values[0], 10))}
                                                    value={field.value?.toString() ?? ""}
                                                    placeholder="Select mailbox"
                                                    className="h-10 w-full"
                                                    noItemsComponent={
                                                        <div className="p-2">
                                                            <p className="text-xs">
                                                                No mailbox. Please select an account first.
                                                            </p>
                                                        </div>
                                                    }
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                placeholder="Search in subject, body, attachments..."
                                                className="h-11 text-base"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-2 sm:ml-auto sm:self-center">
                                <Button type="submit" className="h-11 px-6" disabled={isLoading}>
                                    {isLoading ? "Searching..." : <>Search</>}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    <Filter className="w-4 h-4 mr-1" />
                                    Advanced
                                    {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={() => { handleClear(); reset(); }}
                                >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <FormField
                                control={form.control}
                                name="since"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormLabel className="text-xs whitespace-nowrap">Since:</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                placeholder="Select a date"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="before"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormLabel className="text-xs whitespace-nowrap">Before:</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                placeholder="Select a date"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="has_attachment"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <Checkbox
                                            id="attach"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <FormLabel htmlFor="attach" className="cursor-pointer text-sm font-normal">
                                            Has attachments
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        {showAdvanced && <Accordion type="multiple" className="space-y-3">
                            {/* Sender & Recipients */}
                            <AccordionItem value="people">
                                <AccordionTrigger className="text-sm">
                                    Sender / Recipients
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                                        {(['from', 'to', 'cc', 'bcc'] as const).map((key) => (
                                            <FormField
                                                key={key}
                                                control={form.control}
                                                name={key}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="capitalize text-xs">
                                                            {key === 'from' ? 'From' : key === 'to' ? 'To' : key.toUpperCase()}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={`${key}@example.com`}
                                                                className="h-9"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="attachment">
                                <AccordionTrigger className="text-sm">
                                    Attachments & Size
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="attachment_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Attachment name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="invoice.pdf" className="h-9" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="min_size"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Minimum (bytes)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="1MB = 1048576" className="h-9" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="max_size"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Maximum (bytes)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="10MB = 10485760" className="h-9" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="ids">
                                <AccordionTrigger className="text-sm">
                                    Message-ID
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="message_id"
                                            render={({ field }) => (
                                                <FormItem className="col-span-full">
                                                    <FormControl>
                                                        <Input placeholder="<abc123@example.com>" className="h-9" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Original email Message-ID header
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>}
                    </div>
                </form>
            </Form>
        </SheetContent>
    </Sheet>);
}