# Fly.io Security Documentation

Securing a public cloud platform like Fly.io is a hard problem, and they take it seriously. The Fly.io platform comes with built-in security like hardware isolation, private networking over WireGuard, and TLS termination.

## Organization and App Security

### SSO for Organizations

Set up org-wide Single Sign-on with Google or GitHub. This provides centralized authentication management and improved security by leveraging enterprise identity providers.

### Remove a Member from an Organization

When removing a user from an organization, Fly.io recommends the following steps to help keep the organization secure:

1. Remove the user from the organization
2. Rotate secrets and credentials
3. Check for any resources or configurations the user may have created

### Built-in TLS Termination

Fly.io provides TLS termination by default for your web apps. This means your applications automatically receive HTTPS support without requiring additional configuration.

## Security Extensions

### Application Security by Arcjet

Arcjet security layer can be used to protect your JavaScript app with just a few lines of code. This provides protection against common web application attacks.

## Tokens

### Access Tokens

Use tokens to manage access to organizations and apps. Tokens can be scoped to specific resources and permissions, allowing for fine-grained access control.

The different types of tokens include:

- **Personal access tokens**: For individual user access
- **Machine tokens**: For automation and CI/CD pipelines
- **App tokens**: Scoped to specific applications

### OpenID Connect

Use OpenID Connect (OIDC) to manage access to 3rd party services. This allows secure authentication without storing sensitive credentials.

## Interview Transcription POC Security Findings

During our interview transcription proof-of-concept implementation on Fly.io, we observed and confirmed several important security features:

### Isolated Test Environment

We successfully created a completely isolated testing environment that maintained separation from production systems:

1. **App-scoped deployment tokens**: Created limited-scope tokens with 48-hour expiry for secure deployment
2. **Environment isolation**: No connectivity to production databases or resources
3. **Unique application name**: Clear identification of test resources to prevent confusion with production
4. **Resource containment**: Dedicated machines only for test purposes

### Multi-Region Security

Our tests with multi-region deployment confirmed strong security across global infrastructure:

1. **Consistent TLS termination**: HTTPS worked seamlessly across all regions
2. **WebSocket secure protocol**: WSS (WebSocket Secure) functioned properly without additional configuration
3. **Independent regional security**: Each region maintained its own secure environment
4. **Shared secrets management**: Environment variables and secrets were properly propagated to all regions

### WebSocket Security

Our WebSocket implementation benefited from several built-in security features:

1. **Automatic TLS upgrade**: Plain WS connections were automatically upgraded to WSS
2. **CORS protection**: Proper CORS headers were applied to both HTTP and WebSocket connections
3. **Connection isolation**: Each WebSocket connection was properly isolated from others
4. **Session management**: Session IDs were securely generated and managed

### Secrets Management

The secrets management system worked effectively for secure credential handling:

1. **Environment variable encapsulation**: Secrets were properly isolated from the container filesystem
2. **Dynamic injection**: Secrets were injected at runtime without appearing in logs or image layers
3. **Region-independent access**: Consistent secret access across all deployed regions
4. **Deployment-time secret setting**: `fly secrets set` command provided a secure way to manage sensitive values

These security findings validate Fly.io as a suitable platform for handling sensitive interview audio and transcription data, with appropriate security controls at multiple levels.

## Fly.io Platform Security

### Shared Responsibility Model

Fly.io operates under a shared responsibility model for security:

- **Fly.io's responsibilities**: Infrastructure security, hardware isolation, network security
- **Customer responsibilities**: Application security, data security, access management

### Fly.io Security Practices and Compliance Overview

Key security practices implemented by Fly.io:

1. **Hardware isolation**: VMs run in isolated environments
2. **Network security**: Private WireGuard networking between resources
3. **TLS by default**: Automatic HTTPS for public-facing services
4. **Regular security updates**: Platform components receive timely security patches
5. **Authentication controls**: Multi-factor authentication and token-based access

## Talk to the Security Team

If you have a security question, concern, or believe you've found a vulnerability in any part of Fly.io's infrastructure, you can contact them at security@fly.io. 