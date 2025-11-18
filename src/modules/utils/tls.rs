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
        imap::session::SessionStream,
    },
    raise_error,
};
use rustls::RootCertStore;
use std::sync::Arc;

pub async fn establish_tls_stream(
    server_hostname: &str,
    alpn_protocols: &[&str],
    stream: impl SessionStream + 'static,
) -> BichonResult<impl SessionStream> {
    let tls_stream = establish_rustls_stream(server_hostname, alpn_protocols, stream).await?;
    let boxed_stream: Box<dyn SessionStream> = Box::new(tls_stream);
    Ok(boxed_stream)
}

pub async fn establish_rustls_stream(
    server_hostname: &str,
    alpn_protocols: &[&str],
    stream: impl SessionStream,
) -> BichonResult<impl SessionStream> {
    // Create a root certificate store and add default trusted roots
    let root_store = RootCertStore {
        roots: webpki_roots::TLS_SERVER_ROOTS.into(),
    };

    // Configure the Rustls client with the root certs and no client authentication
    let mut config = rustls::ClientConfig::builder()
        //builder_with_provider(
        //     rustls::crypto::ring::default_provider().into(),
        // )
        // .with_protocol_versions(&[&rustls::version::TLS13])
        // .unwrap()
        .with_root_certificates(root_store)
        .with_no_client_auth();

    // Set the ALPN protocols
    config.alpn_protocols = alpn_protocols
        .iter()
        .map(|s| s.as_bytes().to_vec())
        .collect();

    let tls_connector = tokio_rustls::TlsConnector::from(Arc::new(config));

    let server_name = rustls_pki_types::ServerName::try_from(server_hostname)
        .map_err(|_| raise_error!("Invalid DNS name".into(), ErrorCode::NetworkError))?
        .to_owned();

    let tls_stream = tls_connector
        .connect(server_name, stream)
        .await
        .map_err(|e| raise_error!(e.to_string(), ErrorCode::NetworkError))?;

    Ok(tls_stream)
}
