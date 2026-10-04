# Case Study: SDA Matrimony (DigiLocker Verification)

> **Platform**: Backend Integration Module  
> **Tech Stack**: FastAPI, Uvicorn, TypeScript, DigiLocker OAuth2 Gateway

---

## 1. System Overview

This module delivers a document-only identity verification pipeline integrating India's DigiLocker public digital infrastructure, intentionally avoiding invasive biometric capture.

---

## 2. Key Architectural Decisions

- **Deliberate Exclusion of Biometrics**: The module explicitly excludes facial recognition, selfie matching, OpenCV image processing, and biometric capture.
- **Token-Based Consent Flow**: Verification relies on authenticated user consent tokens issued by DigiLocker rather than storing sensitive government ID scans on private servers.
- **Ephemeral Processing**: Documents fetched for verification are checked, status flags are set, and raw document buffers are purged from memory immediately.

---

## 3. What Was Learned

- **Avoiding Unnecessary Data Collection**: Collecting facial scans and biometric markers creates significant regulatory liabilities and data breach risks. Proving identity via cryptographically signed government tokens achieves equal or better assurance with minimal liability.
- **OAuth2 Token Expirations**: Managing token exchange lifecycles requires reliable error handling when user consent sessions expire mid-flow.
