# Security Policy

## Reporting a Vulnerability

Please report security issues privately to the project maintainer instead of opening a public issue.

## Secrets

Do not commit:

- WeChat mini program AppSecret
- Cloud environment credentials
- API keys
- access tokens
- private user data

Use environment variables or cloud-function settings for runtime secrets.
