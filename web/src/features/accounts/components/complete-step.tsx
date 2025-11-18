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


import { CheckCircle } from "lucide-react"; // Using Lucide icon library
import { Button } from "@/components/ui/button"; // Using custom button component

export default function CompleteStep() {
    return (
        <div className="flex flex-col items-center justify-center h-[25rem] p-6">
            {/* Success Icon */}
            <div className="mb-6 text-green-500">
                <CheckCircle className="w-16 h-16" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold mb-4">Registration Successful!</h1>
            <p className="text-lg text-gray-600 mb-8 text-center">
                Your email account has been successfully added.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
                <Button
                    variant="default"
                    onClick={() => {
                        // Redirect to home page
                        window.location.href = "/";
                    }}
                >
                    Authorize via OAuth2
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        // View details
                        window.location.href = "/accounts";
                    }}
                >
                    View Details
                </Button>
            </div>
        </div>
    );
}