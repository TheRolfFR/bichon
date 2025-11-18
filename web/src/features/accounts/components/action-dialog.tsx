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


import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AccountModel, ImapConfig } from '../data/schema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Step1 from './step1';
import Step2 from './step2';
import Step3 from './step3';
import Step4 from './step4';
import CompleteStep from './complete-step';
import { create_account, autoconfig, update_account } from '@/api/account/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastAction } from '@/components/ui/toast';
import { AxiosError } from 'axios';

const encryptionSchema = z.union([
  z.literal('Ssl'),
  z.literal('StartTls'),
  z.literal('None'),
]);

const authTypeSchema = z.union([
  z.literal('Password'),
  z.literal('OAuth2'),
]);

const authConfigSchema = (isEdit: boolean) =>
  z.object({
    auth_type: authTypeSchema,
    password: z.string().optional(), // Always optional at base level
  }).refine(
    (data) => {
      // Only validate password when:
      // 1. Auth type is Password
      // 2. In create mode (not edit)
      if (data.auth_type === 'Password' && !isEdit) {
        return !!data.password?.trim();
      }
      return true;
    },
    {
      message: 'Password is required when auth method is Password',
      path: ['password'],
    }
  );

const imapConfigSchema = (isEdit: boolean) =>
  z.object({
    host: z.string({ required_error: 'IMAP host is required' }).min(1, { message: 'IMAP host cannot be empty' }),
    port: z.number().int().min(0, { message: 'IMAP port must be a positive integer' }).max(65535, { message: 'IMAP port must be less than 65536' }),
    encryption: encryptionSchema,
    auth: authConfigSchema(isEdit),
    use_proxy: z.number().optional(),
  });


const relativeDateSchema = z.object({
  unit: z.enum(["Days", "Months", "Years"], { message: "Please select a unit" }),
  value: z.number({ message: 'Please enter a value' }).int().min(1, "Must be at least 1"),
});

const dateSelectionSchema = z.union([
  z.object({ fixed: z.string({ message: "Please select a date" }) },),
  z.object({ relative: relativeDateSchema }),
  z.undefined(),
]);

// Define static Account type to avoid z.infer issue with dynamic schema
export type Account = {
  name?: string;
  email: string;
  imap: {
    host: string;
    port: number;
    encryption: 'Ssl' | 'StartTls' | 'None';
    auth: {
      auth_type: 'Password' | 'OAuth2';
      password?: string;
    };
    use_proxy?: number;
  };
  enabled: boolean;
  date_since?: {
    fixed?: string;
    relative?: {
      unit?: 'Days' | 'Months' | 'Years';
      value?: number;
    };
  };
  folder_limit?: number;
  sync_interval_min: number;
};

const accountSchema = (isEdit: boolean) =>
  z.object({
    name: z.string().optional(),
    email: z.string({ required_error: 'Email is required' }).email({ message: 'Invalid email address' }),
    imap: imapConfigSchema(isEdit),
    enabled: z.boolean(),
    date_since: dateSelectionSchema.optional(),
    folder_limit: z
      .number({ invalid_type_error: 'Folder limit must be a number' })
      .int()
      .min(100, { message: 'Folder limit must be at least 100' })
      .optional(),
    sync_interval_min: z.number({ invalid_type_error: 'Incremental sync interval must be a number' }).int().min(10, { message: 'Incremental sync interval must be at least 10 minutes' }),
  });

type Step = {
  id: `step-${number}`;
  name: string;
  fields: (keyof Account)[];
};

export type Steps = [
  { id: "complete"; name: "Complete"; fields: [] },
  ...Step[]
];

const steps: Steps = [
  { id: "complete", name: "Complete", fields: [] },
  {
    id: "step-1",
    name: "Email Address",
    fields: ["email"],
  },
  {
    id: "step-2",
    name: "IMAP",
    fields: ["imap"],
  },
  { id: "step-3", name: "Sync Preferences", fields: ["enabled", "date_since", "folder_limit", "sync_interval_min"] },
  { id: "step-4", name: "Summary", fields: [] },
];

const LAST_STEP = steps.length - 1;
const COMPLETE_STEP = 0;

interface Props {
  currentRow?: AccountModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultValues: Account = {
  name: undefined,
  email: '',
  imap: {
    host: "",
    port: 993,
    encryption: 'Ssl',
    auth: {
      auth_type: 'Password',
      password: undefined,
    },
    use_proxy: undefined
  },
  enabled: true,
  date_since: undefined,
  folder_limit: undefined,
  sync_interval_min: 10,
};

const emptyImap: ImapConfig = {
  host: "",
  port: 0,
  encryption: "None",
  auth: { auth_type: "Password", password: undefined },
  use_proxy: undefined,
};

const mapCurrentRowToFormValues = (currentRow: AccountModel): Account => {
  const imap = { ...(currentRow.imap ?? emptyImap) };
  // Handle password and use_proxy conversion
  imap.auth = { ...imap.auth, password: undefined };
  if (imap.use_proxy === null) {
    imap.use_proxy = undefined;
  }

  let account = {
    name: currentRow.name === null ? undefined : currentRow.name,
    email: currentRow.email,
    imap,
    enabled: currentRow.enabled,
    date_since: currentRow.date_since ?? undefined,
    folder_limit: currentRow.folder_limit ?? undefined,
    sync_interval_min: currentRow.sync_interval_min ?? 10,
  };

  return account;
};

export function AccountActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow;
  const [currentStep, setCurrentStep] = React.useState(1);
  const { toast } = useToast();
  const [autoConfigLoading, setAutoConfigLoading] = React.useState(false);

  const form = useForm<Account>({
    mode: "all",
    defaultValues: isEdit ? mapCurrentRowToFormValues(currentRow) : defaultValues,
    resolver: zodResolver(accountSchema(isEdit)),
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: create_account,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => update_account(currentRow?.id!, data),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  function handleSuccess() {
    toast({
      title: `Account ${isEdit ? 'Updated' : 'Created'}`,
      description: `Your account has been successfully ${isEdit ? 'updated' : 'created'}.`,
      action: <ToastAction altText="Close">Close</ToastAction>,
    });

    queryClient.invalidateQueries({ queryKey: ['account-list'] });
    form.reset();
    onOpenChange(false);
  }

  function handleError(error: AxiosError) {
    const errorMessage =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      `${isEdit ? 'Update' : 'Creation'} failed, please try again later`;

    toast({
      variant: "destructive",
      title: `Account ${isEdit ? 'Update' : 'Creation'} Failed`,
      description: errorMessage as string,
      action: <ToastAction altText="Try again">Try again</ToastAction>,
    });
    console.error(error);
  }

  const onSubmit = React.useCallback(
    (data: Account) => {
      const commonData = {
        email: data.email,
        name: data.name,
        imap: {
          ...data.imap,
          auth: {
            ...data.imap.auth,
            password: data.imap.auth.auth_type === 'OAuth2'
              ? undefined
              : (isEdit && !data.imap.auth.password ? undefined : data.imap.auth.password),
          },
        },
        enabled: data.enabled,
        date_since: data.date_since,
        folder_limit: data.folder_limit,
        sync_interval_min: data.sync_interval_min,
      };
      if (isEdit) {
        updateMutation.mutate(commonData);
      } else {
        const payload = {
          ...commonData,
          account_type: "IMAP",
        };
        createMutation.mutate(payload);
      }
    },
    [isEdit, updateMutation, createMutation]
  );

  const handleNav = async (index: number) => {
    let isValid = true;
    let failedStep = currentStep;
    for (let i = currentStep; i < index && isValid; i++) {
      isValid = await form.trigger(steps[i].fields);
      if (!isValid) {
        failedStep = i;
      }
    }
    if (isValid) {
      setCurrentStep(index);
    } else {
      setCurrentStep(failedStep);
    }
  };

  async function handleContinue() {
    const isValid = await form.trigger(steps[currentStep].fields);
    if (!isValid) {
      return;
    }
    if (currentStep === 1) {
      let allValues = form.getValues();
      if (
        allValues.imap.host.trim() !== "" &&
        allValues.imap.port > 0
      ) {
        handleNav(currentStep + 1);
        return;
      }
      setAutoConfigLoading(true);
      const email = form.getValues('email');

      try {
        const result = await autoconfig(email);
        if (result) {
          form.setValue('imap.host', result.imap.host);
          form.setValue('imap.port', result.imap.port);
          form.setValue('imap.encryption', result.imap.encryption);
          if (result.oauth2) {
            form.setValue('imap.auth.auth_type', 'OAuth2');
          }
        }
        setAutoConfigLoading(false);
      } catch (error) {
        console.error('Auto-configuration failed:', error);
        setAutoConfigLoading(false);
      }
      handleNav(currentStep + 1);
    } else {
      handleNav(currentStep + 1);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        setCurrentStep(1);
        onOpenChange(state);
      }}
    >
      <DialogContent className='max-w-5xl'>
        <DialogHeader className='text-left mb-4'>
          <DialogTitle>{isEdit ? "Update Account" : "Add Account"}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the email account here. ' : 'Add new email account here. '}
            Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[38rem] w-full pr-4 -mr-4 py-1">
          <>
            {/* Mobile Steps (hidden on desktop) */}
            {currentStep !== COMPLETE_STEP && (
              <div className="flex my-5 space-x-4 md:hidden">
                {steps.map(
                  (step, index) =>
                    index !== COMPLETE_STEP && (
                      <div className="z-20 my-3 ml-2 flex items-center" key={step.id}>
                        <Button
                          className={`size-9 rounded-full border font-bold ${`step-${currentStep}` === step.id ? "" : "bg-gray-200 text-black"
                            }`}
                          disabled={`step-${currentStep}` === step.id || currentStep === COMPLETE_STEP}
                          onClick={() => handleNav(index)}
                        >
                          {index}
                        </Button>
                      </div>
                    )
                )}
              </div>
            )}

            <div className="w-full max-w-full p-4">
              <div className="flex md:h-min rounded-xl md:rounded-2xl p-4">
                {currentStep !== COMPLETE_STEP && (
                  <div className="hidden md:block w-[260px] flex-shrink-0 rounded-xl p-5 pt-7 fixed">
                    {steps.map(
                      (step, index) =>
                        index !== COMPLETE_STEP && (
                          <div className="my-3 ml-2 flex items-center" key={step.id}>
                            <Button
                              className={`size-8 border rounded-full text-sm font-bold ${`step-${currentStep}` === step.id
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-black"
                                }`}
                              disabled={`step-${currentStep}` === step.id || currentStep === COMPLETE_STEP}
                              onClick={() => handleNav(index)}
                            >
                              {index}
                            </Button>
                            <div className="flex flex-col items-baseline uppercase ml-5">
                              <span className="text-xs">Step {index}</span>
                              <span className="font-bold text-sm tracking-wider">{step.name}</span>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}

                <Form {...form}>
                  <form
                    id="account-register-form"
                    className={`flex-grow flex flex-col px-4 md:px-8 lg:px-12 ${currentStep !== COMPLETE_STEP ? 'ml-[240px]' : ''
                      }`}
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    {currentStep === 1 && <Step1 isEdit={isEdit} />}
                    {currentStep === 2 && <Step2 isEdit={isEdit} />}
                    {currentStep === 3 && <Step3 />}
                    {currentStep === 4 && <Step4 />}
                    {currentStep === COMPLETE_STEP && <CompleteStep />}
                  </form>
                </Form>
              </div>
            </div>
          </>
        </ScrollArea>
        <DialogFooter className="flex flex-wrap gap-2">
          <Button
            disabled={currentStep === 1 || currentStep === COMPLETE_STEP}
            type="button"
            className="flex-grow sm:flex-grow-0 shadow-none text-nowrap text-sm disabled:invisible"
            onClick={() => {
              handleNav(currentStep - 1);
            }}
          >
            Go Back
          </Button>
          <Button
            disabled={currentStep === LAST_STEP || currentStep === COMPLETE_STEP}
            type="button"
            className="flex-grow sm:flex-grow-0 rounded-md md:rounded-lg px-6 disabled:hidden text-sm"
            onClick={handleContinue}
          >
            {autoConfigLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Auto-configuring...</span>
              </>
            ) : (
              "Continue"
            )}
          </Button>
          <Button
            disabled={currentStep !== LAST_STEP}
            type="submit"
            form="account-register-form"
            className="flex-grow sm:flex-grow-0 rounded-md text-sm px-7 disabled:hidden md:rounded-lg"
          >
            {isEdit ? "Save changes" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}