# Security and Compliance Baseline

## Consent and Permissions

- Capture only meetings with explicit client/advisor consent and approved internal permissions.
- Display clear AI-assistance disclosure where required by policy and law.
- Store consent proof with meeting metadata.
- Block processing if consent state cannot be verified.

## Data Protection

- Encrypt all data in transit with TLS 1.2+ and at rest with managed keys.
- Use per-tenant logical isolation and strict access control.
- Minimize retention of raw audio; prefer transcript and audit metadata where policy allows.
- Redact PCI, SSN, account numbers, and other sensitive fields before model processing where feasible.
- Keep secrets in a managed vault, never in source code or environment dumps.

## Model Risk Controls

- Require retrieved evidence for all financial/product/compliance suggestions.
- Use allowlisted knowledge sources with versioned ingestion.
- Run post-generation policy checks before sidebar delivery.
- Maintain prompt, model, retrieval corpus, and validator versions in audit logs.
- Treat the assistant as advisor support, not autonomous advice delivery.

## Auditability

Audit every major event:

- Meeting/session authorization.
- Consent state changes.
- Transcript segment creation.
- Retrieval query and source IDs.
- Suggestion generated, delivered, suppressed, dismissed, or accepted.
- Validator failures and fallback behavior.

## Enterprise Readiness Checklist

- SSO and RBAC.
- Least-privilege service identities.
- CI checks for tests, linting, dependency scanning, and secret scanning.
- SBOM generation.
- Infrastructure as code.
- Disaster recovery plan.
- Incident response runbook.
- Vendor and model risk assessment packet.
