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


import {
  IconHelp,
  IconLayoutDashboard,
  IconLockAccess,
  IconSettings
} from '@tabler/icons-react'
import { IdCard, Inbox, Mailbox, Search } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        }
      ],
    },
    {
      title: 'Accounts',
      items: [
        {
          title: 'Accounts',
          url: '/accounts',
          icon: Inbox,
        },
        {
          title: 'MailBox',
          url: '/mailboxes',
          icon: Mailbox,
        },
        {
          title: 'Search',
          url: '/search',
          icon: Search,
        }
      ],
    },
    {
      title: 'Auth',
      items: [
        {
          title: 'OAuth2',
          url: '/oauth2',
          icon: IdCard,
        },
        {
          title: 'Access Tokens',
          url: '/access-tokens',
          icon: IconLockAccess,
        }
      ]
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: IconSettings,
        },
        {
          title: 'API Documentation',
          url: '/api-docs',
          icon: IconHelp,
        },
      ],
    },
  ],
}
