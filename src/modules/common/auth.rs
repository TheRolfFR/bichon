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


use crate::{
    modules::{
        error::{code::ErrorCode, BichonResult},
        settings::{cli::SETTINGS, system::SystemSetting},
        token::{root::ROOT_TOKEN, AccessToken, AccountInfo},
        utils::rate_limit::RATE_LIMITER_MANAGER,
    },
    raise_error,
};
use governor::clock::{Clock, QuantaClock};
use poem::{
    web::{
        headers::{authorization::Bearer, Authorization, HeaderMapExt},
        RealIp,
    },
    Endpoint, FromRequest, Middleware, Request, RequestBody, Result,
};
use serde::Deserialize;
use std::{collections::BTreeSet, net::IpAddr, sync::Arc};

use super::create_api_error_response;

pub struct ApiGuard;

pub struct ApiGuardEndpoint<E> {
    ep: E,
}

impl<E: Endpoint> Middleware<E> for ApiGuard {
    type Output = ApiGuardEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        ApiGuardEndpoint { ep }
    }
}

#[derive(Deserialize)]
struct Param {
    access_token: String,
}

impl<E: Endpoint> Endpoint for ApiGuardEndpoint<E> {
    type Output = E::Output;

    async fn call(&self, mut req: Request) -> Result<Self::Output> {
        let context = authorize_access(&req).await?;
        req.set_data(Arc::new(context));
        self.ep.call(req).await
    }
}

#[derive(Clone, Debug, Default)]
pub struct ClientContext {
    pub ip_addr: Option<IpAddr>,
    pub access_token: Option<AccessToken>,
    pub is_root: bool,
}

impl ClientContext {
    pub fn require_root(&self) -> BichonResult<()> {
        if !SETTINGS.bichon_enable_access_token || self.is_root {
            Ok(())
        } else {
            Err(raise_error!(
                "Root access required".into(),
                ErrorCode::PermissionDenied
            ))
        }
    }

    pub fn require_authorized(&self) -> BichonResult<()> {
        if !SETTINGS.bichon_enable_access_token || self.is_root || self.access_token.is_some() {
            Ok(())
        } else {
            Err(raise_error!(
                "Authorization required".into(),
                ErrorCode::PermissionDenied
            ))
        }
    }

    pub fn require_account_access(&self, account_id: u64) -> BichonResult<()> {
        if !SETTINGS.bichon_enable_access_token || self.is_root {
            return Ok(());
        }

        match &self.access_token {
            Some(token) if token.can_access_account(account_id) => Ok(()),
            _ => Err(raise_error!(format!(
                "You do not have permission to access the requested email account (ID: {}). Please check your access rights or contact the administrator.",
                account_id
            ), ErrorCode::PermissionDenied)),
        }
    }

    pub fn accessible_accounts(&self) -> BichonResult<Option<&BTreeSet<AccountInfo>>> {
        if !SETTINGS.bichon_enable_access_token || self.is_root {
            Ok(None) // All accounts are accessible
        } else {
            match &self.access_token {
                Some(token) => Ok(Some(&token.accounts)),
                None => Err(raise_error!(
                    "Missing access token".into(),
                    ErrorCode::PermissionDenied
                )),
            }
        }
    }
}

impl<'a> FromRequest<'a> for ClientContext {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        extract_client_context(req).await
    }
}

pub async fn extract_client_context(req: &Request) -> Result<ClientContext> {
    if SETTINGS.bichon_enable_access_token {
        let ip_addr = RealIp::from_request_without_body(req)
            .await
            .map_err(|_| {
                create_api_error_response(
                    "Failed to parse client IP address",
                    ErrorCode::InvalidParameter,
                )
            })?
            .0
            .ok_or_else(|| {
                create_api_error_response(
                    "Failed to parse client IP address",
                    ErrorCode::InvalidParameter,
                )
            })?;
        // Extract access token from Bearer header or query params
        let bearer = req
            .headers()
            .typed_get::<Authorization<Bearer>>()
            .map(|auth| auth.0.token().to_string())
            .or_else(|| req.params::<Param>().ok().map(|param| param.access_token));

        let token = bearer.ok_or_else(|| {
            create_api_error_response("Valid access token not found", ErrorCode::PermissionDenied)
        })?;

        // Check for root token
        if let Ok(Some(root)) = SystemSetting::get(ROOT_TOKEN) {
            if root.value == token {
                return Ok(ClientContext {
                    ip_addr: Some(ip_addr),
                    access_token: None,
                    is_root: true,
                });
            }
        }

        // Validate and update access token
        let validated_token = AccessToken::try_update_access_timestamp(&token)
            .await
            .map_err(|_| {
                create_api_error_response("Invalid access token", ErrorCode::PermissionDenied)
            })?;

        return Ok(ClientContext {
            ip_addr: Some(ip_addr),
            access_token: Some(validated_token),
            is_root: false,
        });
    }

    Ok(Default::default())
}

pub async fn authorize_access(req: &Request) -> Result<ClientContext, poem::Error> {
    let context = extract_client_context(&req).await?;
    context.require_authorized().map_err(|error| {
        create_api_error_response(&error.to_string(), ErrorCode::PermissionDenied)
    })?;

    if let Some(access_token) = &context.access_token {
        if let Some(access_control) = &access_token.acl {
            if let Some(ip_addr) = context.ip_addr {
                if let Some(whitelist) = &access_control.ip_whitelist {
                    if !whitelist.contains(&ip_addr.to_string()) {
                        return Err(create_api_error_response(
                            &format!("IP {} not in whitelist", ip_addr),
                            ErrorCode::PermissionDenied,
                        ));
                    }
                }
            }

            if let Some(rate_limit) = &access_control.rate_limit {
                if let Err(not_until) = RATE_LIMITER_MANAGER
                    .check(&access_token.token, rate_limit.clone())
                    .await
                {
                    let wait_duration = not_until.wait_time_from(QuantaClock::default().now());
                    return Err(create_api_error_response(
                        &format!(
                            "Rate limit: {}/{}s. Retry after {}s",
                            rate_limit.quota,
                            rate_limit.interval,
                            wait_duration.as_secs()
                        ),
                        ErrorCode::TooManyRequest,
                    ));
                }
            }
        }
    }

    Ok(context)
}
