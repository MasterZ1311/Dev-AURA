# Non-Extractive Verification & Clinical Data Ethics

---

## 1. The Principle of Non-Extractive Identity

Traditional verification platforms often unnecessarily collect biometric data, selfie comparisons, and permanent copies of government IDs, creating significant privacy risks.

```mermaid
sequenceDiagram
    participant User as Applicant
    participant App as Application Service
    participant DigiLocker as Government Identity Gateway (DigiLocker)

    User->>App: Request Onboarding Verification
    App->>DigiLocker: Initiate OAuth2 Consent Flow
    DigiLocker->>User: User Approves Document Access
    DigiLocker-->>App: Authorize One-Time Cryptographic Token
    App->>DigiLocker: Fetch Verified Document Status
    App->>App: Record "Verification Passed" Flag
    App->>App: Discard Raw Document Buffers from Memory
    App-->>User: Verification Complete
```

---

## 2. Clinical Risk Calculation Rules

1. **Explainable Methodology**: Calculations must state their clinical parameters (e.g. age at menarche, first live birth, family history of breast cancer).
2. **Transparent Output**: Always frame scores clearly (e.g., "5-Year Absolute Risk: 2.1% (Population Average: 1.2%)") and advise consulting healthcare professionals.
3. **Client-Side Evaluation**: Calculating health risk locally in the browser protects personal health data from unnecessary network exposure.
