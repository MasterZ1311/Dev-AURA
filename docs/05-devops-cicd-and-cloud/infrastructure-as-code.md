# Infrastructure as Code with Terraform and OpenTofu

> **Difficulty**: Advanced  
> **Target Outcome**: Provision and manage declarative, version-controlled cloud infrastructure.

---

## Technical Architecture: Declarative State Reconciliation Engine

Infrastructure as Code compares target configuration declarations against recorded state and live cloud resources to compute an execution graph:

```mermaid
graph TD
    HCLDeclarations["Target State: *.tf Code (VPC, RDS, ECS)"] --> TerraformCore[Terraform / OpenTofu Core Engine]
    
    subgraph State Consistency & Locking
        RemoteStorage[Remote Encrypted State: AWS S3 / GCS] <-->|Read / Write State JSON| TerraformCore
        DistributedLock[Distributed State Lock: DynamoDB / Consul] <-->|Acquire / Release Lock| TerraformCore
    end
    
    TerraformCore <-->|Query Current Live State| CloudAPIs[Cloud Provider APIs: AWS / GCP / Azure]
    
    TerraformCore --> PlanOutput["Execution Plan Graph: Calculate Add (+), Modify (~), Destroy (-)"]
    PlanOutput --> ApplyApproval{"Manual / CI Approval Gate"}
    
    ApplyApproval -->|Approved| IdempotentApply[Idempotent Apply: API Mutations to Cloud Providers]
    IdempotentApply --> LiveInfra[Live Infrastructure Converged to Target State]
```

---

## Principles of Infrastructure as Code

- **Declarative**: Express target infrastructure states rather than imperative execution scripts.
- **Idempotent**: Re-executing infrastructure code converges safely toward the defined state.
- **Auditable**: Infrastructure modifications are reviewed through standard pull requests.

---

## Modular Architecture Layout

```text
terraform/
├── main.tf        # Provider definitions and module calls
├── variables.tf   # Environment inputs
├── outputs.tf     # Exported attributes (VPC IDs, endpoints)
├── backend.tf     # Remote state configuration with locking
└── modules/
    ├── vpc/
    ├── database/
    └── compute/
```

### Remote State Configuration (`backend.tf`):
```hcl
terraform {
  required_version = ">= 1.7.0"
  backend "s3" {
    bucket         = "company-terraform-state-prod"
    key            = "services/aura-api/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```

---

## Contributor Challenges
- [ ] Pulumi versus Terraform architectural comparison.
- [ ] Local cloud development with LocalStack.
