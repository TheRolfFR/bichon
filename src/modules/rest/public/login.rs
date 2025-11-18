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


use crate::modules::token::root::check_root_password;
use poem::{handler, IntoResponse, Response};
use tracing::error;

/// Login endpoint for Root user
///
/// Accepts a plain text password and returns the `root_token`
/// on successful authentication.
#[handler]
pub async fn login(password: String) -> Response {
    match check_root_password(&password) {
        Ok(root_token) => Response::builder()
            .status(http::StatusCode::OK)
            .content_type("text/plain")
            .body(root_token)
            .into_response(),
        Err(e) => {
            error!("Root login failed: {:?}", e);
            Response::builder()
                .status(http::StatusCode::UNAUTHORIZED)
                .content_type("text/plain")
                .body(e.to_string())
                .into_response()
        }
    }
}
