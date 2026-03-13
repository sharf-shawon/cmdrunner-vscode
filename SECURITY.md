# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes    |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a security vulnerability, please email the maintainer directly or use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/sharf-shawon/cmdrunner-vscode/security)
2. Click "Report a vulnerability"
3. Fill out the form with as much detail as possible

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if you have one)

## Response Timeline

- **Acknowledgement**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix / Patch**: Within 30 days for critical/high severity

## Security Design Principles

cmdRunner is designed with security as a first-class concern:

1. **No hidden execution**: All commands run in VS Code's visible integrated terminal via `terminal.sendText()`. No background processes.
2. **Workspace trust**: Respects VS Code's workspace trust model.
3. **Blocked patterns**: Configurable regex blocklist for dangerous command patterns.
4. **Secret masking**: Sensitive tokens are redacted from audit logs.
5. **Checksum verification**: Config files can be pinned to SHA-256 checksums.
6. **Audit logging**: All command executions are logged with timestamps.

## Disclosure Policy

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). We will:

1. Confirm the vulnerability within 48 hours
2. Work on a fix and release it within 30 days
3. Credit the reporter (unless they prefer anonymity)
4. Publish a CVE if appropriate
