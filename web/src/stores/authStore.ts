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


const ACCESS_TOKEN_KEY = 'f4d3e92d7b1241a8a0b2e7cdb5c5d19d';

export const setAccessToken = (token: string) => {
  const data = {
    accessToken: token,
    expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days in milliseconds
  };
  sessionStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(data));
};

export const getAccessToken = (): string => {
  const item = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (item) {
    try {
      const data = JSON.parse(item);
      if (Date.now() < data.expiresAt) {
        return data.accessToken;
      } else {
        resetAccessToken(); // Clear the expired token
      }
    } catch (error) {
      console.error('Error parsing access token:', error);
      resetAccessToken(); // Clear invalid data
    }
  }
  return '';
};

export const resetAccessToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};