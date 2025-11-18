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


import { useFormContext } from "react-hook-form";
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl,
    FormDescription,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Account } from "./action-dialog";

interface StepProps {
    isEdit: boolean;
}

export default function Step1({ isEdit }: StepProps) {
    const { control } = useFormContext<Account>();

    return (
        <>
            <h1 className="my-3 md:mt-8">Email Account Registration</h1>
            <p className="mb-5 md:mb-8">
                Please provide your email address. In the next steps, you will configure the IMAP/SMTP details. Using this email address, we will attempt to automatically retrieve the SMTP/IMAP server addresses.
            </p>
            <div className="space-y-8">
                <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center justify-between">
                                Email Address:
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="e.g john.doe@example.com" readOnly={isEdit} {...field} />
                            </FormControl>
                            <FormMessage />
                            {isEdit && (
                                <FormDescription>
                                    The email account address cannot be modified when editing.
                                </FormDescription>
                            )}
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center justify-between">
                                Name:
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="e.g john.doe" {...field} />
                            </FormControl>
                            <FormDescription>Optional</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </>
    );
}