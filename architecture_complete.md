# Agentic AI-Powered Database Migration Assistant — V1 Architecture

## 1. Purpose

This document defines the complete V1 architecture for an **Agentic AI-Powered Database Migration Assistant**.

V1 focuses on reliable **PostgreSQL → MySQL** migration while keeping the architecture extensible for future source/target database combinations.

The platform is designed around the principle:

> **Agents reason; deterministic tools execute.**

The system uses LLMs/agents for interpretation, ambiguous transformation decisions, planning and risk reasoning. Deterministic code and database tools perform metadata extraction, DDL construction, execution, data movement, checkpointing and validation wherever those operations can be made reliable without an LLM.

---

# 2. V1 Scope

### Supported migration

```text
Source: PostgreSQL
Target: MySQL
```

### V1 migrates

- Tables
- Columns
- Data types
- Primary keys
- Foreign keys
- Indexes
- Actual table data

### Discovery also identifies

- Views
- Functions
- Procedures
- Triggers
- Sequences
- Other database objects

These additional objects are **discovered and reported in V1**, but their complete migration is outside the V1 core migration scope. The architecture keeps object-specific transformation modules extensible so they can be added later.

### V1 characteristics

- Source database is read-only.
- Target database already exists and is empty.
- Database connections are supplied as connection strings.
- Data migration is batch-based.
- Migration supports persistent checkpoints and resume after application failure.
- The system automatically determines dependency order.
- The user reviews and approves the migration plan before actual migration.
- Users can modify individual migration decisions before approval.
- Invalid modifications are rejected with an explanation.
- Safe conversions can proceed autonomously.
- Ambiguous/high-risk decisions require human review.
- One active migration job per user in V1.
- Each user has migration history.

---

# 3. Functional Workflow

The complete V1 workflow is:

```text
Connect
   ↓
Discover
   ↓
Analyse
   ↓
Generate Migration Decisions
   ↓
Plan
   ↓
Generate Source DDL
   ↓
Translate SQL where required
   ↓
Generate Target DDL
   ↓
Validate Target DDL / Plan
   ↓
Test Migration Plan
   ↓
Human Review / Modification / Approval
   ↓
Create Target Schema
   ↓
Batch Data Migration
   ↓
Verify Migration
   ↓
Generate Report
```

The system should not use an LLM for every step. Deterministic operations remain deterministic.

---

# 4. High-Level Architecture

```text
                                  ┌───────────────────┐
                                  │       USER        │
                                  │ Login / Configure  │
                                  │ Review / Approve   │
                                  └─────────┬─────────┘
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │    STREAMLIT UI   │
                                  │                   │
                                  │ • Authentication  │
                                  │ • Connections     │
                                  │ • Discovery       │
                                  │ • Migration Plan  │
                                  │ • Plan Editor     │
                                  │ • Approval        │
                                  │ • Live Progress   │
                                  │ • Reports         │
                                  └─────────┬─────────┘
                                            │ REST/HTTP
                                            ▼
                                  ┌───────────────────┐
                                  │      FASTAPI      │
                                  │      Backend      │
                                  │                   │
                                  │ • Auth            │
                                  │ • Jobs            │
                                  │ • Migration APIs  │
                                  │ • Plan APIs       │
                                  │ • Progress APIs   │
                                  └─────────┬─────────┘
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │       LANGGRAPH         │
                              │   Central Orchestrator   │
                              │                         │
                              │ Workflow + State + HITL │
                              └────────────┬────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          │                                │                                │
          ▼                                ▼                                ▼
   Discovery Agent                  Analysis Agent                  Planning Agent
          │                                │                                │
          │                                │                                │
          └──────────────────────┬─────────┴───────────────┬────────────────┘
                                 │                         │
                                 ▼                         ▼
                          Knowledge Agent             Deterministic
                                 │                    Dependency Graph
                                 ▼                         │
                         PGVector / RAG                  │
                                 │                         │
                                 └─────────────┬───────────┘
                                               ▼
                                      Transformation Agent
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
                  Knowledge Agent         DDL Generator          CrackSQL
                                               │                     │
                                               └──────────┬──────────┘
                                                          ▼
                                                    Target DDL
                                                          │
                                                          ▼
                                                  Target DDL Executor
                                                          │
                                                          ▼
                                                   Validation Agent
                                                          │
                                                          ▼
                                                    Testing Agent
                                                          │
                                                          ▼
                                                  Human Review
                                                          │
                                                Approve / Modify
                                                          │
                                                          ▼
                                                   Migration Agent
                                                          │
                                             ┌────────────┴────────────┐
                                             ▼                         ▼
                                      Batch Reader              Batch Writer
                                             │                         │
                                             └────────────┬────────────┘
                                                          ▼
                                                     MySQL Target
                                                          │
                                                          ▼
                                                Verification Agent
```

---

# 5. Database Roles

The platform has three separate database roles.

## 5.1 Source PostgreSQL

The customer's existing PostgreSQL database.

```text
PostgreSQL SOURCE
       │
       │ READ ONLY
       ▼
Migration Platform
```

The platform can:

- Read database metadata.
- Read table data.
- Read constraints and indexes.
- Read other database objects for discovery.

The platform must not modify the source database.

---

## 5.2 Application PostgreSQL + PGVector

This database belongs to the migration platform.

```text
Application PostgreSQL
│
├── Users
├── Migration Jobs
├── Source Metadata
├── Migration Decisions
├── Migration Plans
├── Agent State
├── Batch Checkpoints
├── Errors
├── Approvals
├── Reports
└── PGVector
      └── Migration Knowledge Base
```

This database is separate from the source PostgreSQL database.

PGVector stores embeddings and metadata for the migration knowledge base.

---

## 5.3 Target MySQL

The customer's existing empty MySQL database.

```text
MySQL TARGET
     │
     ├── CREATE
     ├── INSERT
     ├── ALTER
     └── INDEX / CONSTRAINT creation
```

The migration platform has read/write access to the target.

---

# 6. Connection Management

The user provides database connection strings rather than individual connection fields.

Example conceptual inputs:

```text
PostgreSQL connection URI
MySQL connection URI
```

The connection strings are used at runtime by the database connection layer.

Credentials must not be written into:

- Application logs
- Agent traces
- LLM prompts
- Migration reports
- Migration history
- Error messages

The system should expose sanitized connection information where necessary, such as database type and host identifier without passwords or secrets.

---

# 7. Streamlit UI

Streamlit provides the user-facing application.

## Main UI areas

```text
Login / Signup
      ↓
Create Migration
      ↓
Connection Configuration
      ↓
Discovery Results
      ↓
Migration Analysis
      ↓
Migration Plan
      ↓
Plan Editor
      ↓
Approval
      ↓
Live Migration Progress
      ↓
Migration Report / History
```

## Plan editor

The user can modify:

1. Datatype mappings
2. Tables/columns to include or exclude
3. Migration order
4. Transformation rules
5. Constraint handling
6. Index handling
7. Batch/migration settings
8. Other migration decisions exposed by the generated plan

A modification is not immediately accepted as the final plan.

```text
User Modification
       ↓
Affected Analysis Re-run
       ↓
Dependent Decisions Recalculated
       ↓
Plan Validation
       ↓
Updated Plan Shown
```

If the requested modification is invalid or incompatible, it is rejected and the UI explains why.

---

# 8. FastAPI Backend

FastAPI is the application's API layer between Streamlit and the migration engine.

Responsibilities include:

- Authentication APIs
- User management
- Migration job creation
- Connection configuration handling
- Discovery APIs
- Migration plan APIs
- Plan modification APIs
- Approval APIs
- Migration start/pause/resume APIs
- Migration progress APIs
- Error/status APIs
- Migration history APIs
- Report APIs

FastAPI does not perform the reasoning itself. It communicates with the LangGraph workflow and application database.

---

# 9. LangGraph Central Orchestrator

LangGraph is the central workflow and state orchestration layer.

The architecture intentionally uses **central orchestration** rather than agents directly orchestrating one another.

```text
FastAPI
   ↓
LangGraph
   ↓
Agent / Tool Nodes
   ↓
State Update
   ↓
Next Workflow Node
```

Agents remain highly autonomous inside their assigned responsibilities and can call approved tools, but the overall workflow, state transitions and human approval points are controlled centrally by LangGraph.

---

# 10. LangGraph State

The workflow state should contain structured information rather than relying on conversation history.

Conceptually:

```text
MigrationState
│
├── job_id
├── user_id
├── source_db_type
├── target_db_type
├── source_metadata
├── discovered_objects
├── dependency_graph
├── analysis_results
├── migration_decisions
├── migration_plan
├── generated_ddl
├── validation_results
├── test_results
├── approval_status
├── user_modifications
├── current_stage
├── current_table
├── current_batch
├── checkpoint_reference
├── errors
└── final_report_reference
```

Large data payloads should be stored in application storage/database rather than unnecessarily passed through every LLM call.

---

# 11. Discovery Agent

The Discovery Agent builds a structured inventory of the source PostgreSQL database.

## Inputs

```text
Source PostgreSQL connection
```

## Deterministic discovery tools

The agent uses database metadata queries/drivers to retrieve:

- Schemas
- Tables
- Columns
- Data types
- Nullability
- Default expressions
- Primary keys
- Foreign keys
- Unique constraints
- Indexes
- Relationships
- Views
- Functions
- Procedures
- Triggers
- Sequences

## Output

A structured source database inventory.

```text
DatabaseInventory
├── schemas
├── tables
│   ├── columns
│   ├── primary_keys
│   ├── foreign_keys
│   ├── indexes
│   └── constraints
├── views
├── functions
├── procedures
├── triggers
└── sequences
```

Discovery itself is primarily deterministic. The agent coordinates discovery tools and interprets/report results where required.

---

# 12. Dependency Graph

Dependency analysis should be deterministic wherever possible.

For example:

```text
customers
    │
    ▼
orders
    │
    ▼
order_items
```

Foreign keys establish dependencies between tables.

The dependency graph is used by the Planning and Migration components to determine execution order.

The user does not manually construct the dependency order.

---

# 13. Analysis Agent

The Analysis Agent determines how each discovered source object should be handled for PostgreSQL → MySQL migration.

It considers:

- Source datatype
- Target datatype compatibility
- Defaults
- Auto-generated values
- Primary keys
- Foreign keys
- Indexes
- PostgreSQL-specific constructs
- Data transformation requirements
- Potential data-loss risks
- Ambiguities
- Migration constraints

The Analysis Agent can call the Knowledge Agent when additional migration knowledge is required.

## Example output

```json
{
  "source": "SERIAL",
  "target": "INT AUTO_INCREMENT",
  "confidence": "high",
  "risk": "low",
  "requires_review": false
}
```

The exact schema should be implemented as structured application models rather than free-form text.

---

# 14. Knowledge Agent and RAG

The Knowledge Agent is the dedicated interface to the migration knowledge base.

Agents do not independently implement their own vector-search logic.

```text
Agent
  ↓
Knowledge Agent
  ↓
Retrieve relevant knowledge
  ↓
PGVector
  ↓
Knowledge result
  ↓
Calling agent
```

Every knowledge request explicitly includes source and target database context.

Example:

```text
Source: PostgreSQL
Target: MySQL
Object: SERIAL
Context: Column definition
Question: What target representation and migration considerations apply?
```

## RAG knowledge focus

The project's own RAG knowledge should **not unnecessarily duplicate CrackSQL's SQL translation knowledge**.

The knowledge base should primarily contain:

- Migration strategies
- Datatype migration considerations
- Data transformation implications
- PostgreSQL → MySQL incompatibilities
- Migration risks and exceptions
- Dependency and ordering considerations
- Constraint/index migration considerations
- Validation strategies
- Error remediation strategies
- Performance and batch-processing practices
- Migration best practices
- Known migration issues and examples

CrackSQL remains the specialized SQL translation component.

---

# 15. Transformation Architecture

Transformation is divided into three conceptual responsibilities:

```text
Migration Decisions
       ↓
DDL / SQL Generation
       ↓
SQL Translation where appropriate
       ↓
Target SQL
```

The important distinction is that **database metadata is not directly translated by an LLM**.

---

# 16. Structured Migration Decisions

The Analysis Agent produces structured decisions.

Example:

```text
table: users
column: id
source_type: SERIAL
nullable: false
primary_key: true

migration_decision:
    target_type: INT
    auto_increment: true
    risk: LOW
```

These decisions become the input to deterministic generators.

---

# 17. Schema / DDL Generator

The DDL Generator converts structured migration metadata and decisions into deterministic SQL.

Example structured metadata:

```text
table = users
id = integer
id = primary key
id = auto-generated
name = varchar(100)
```

The generator constructs a corresponding SQL representation rather than asking an LLM to freely write the DDL.

Conceptually:

```text
Source Metadata
      ↓
Migration Decisions
      ↓
DDL Generator
      ↓
SQL Representation
```

This component should be deterministic and testable.

---

# 18. CrackSQL Integration

CrackSQL is treated as a **specialized SQL dialect translation tool**, not as the migration engine.

Conceptually:

```text
Generated SQL
      ↓
CrackSQL
      ↓
Translated SQL
```

The system should only send SQL to CrackSQL where SQL translation is appropriate and supported.

CrackSQL should not be responsible for:

- Reading the source database
- Reading table rows
- Managing migration batches
- Checkpointing
- Writing data to MySQL
- Verifying row counts
- Managing user approvals
- Managing migration jobs

The application remains responsible for these operations.

### Important V1 implementation note

The exact set of DDL constructs supported by the selected CrackSQL implementation should be verified during implementation. The architecture must not assume that every PostgreSQL DDL feature is automatically translated correctly.

---

# 19. Target DDL Executor

After target DDL is generated and validated, the Target DDL Executor executes it against MySQL.

```text
Target DDL
   ↓
Target DDL Executor
   ↓
MySQL
```

This is deterministic database execution.

The LLM does not directly connect to or execute SQL against the database.

Execution errors are returned as structured errors to the workflow.

---

# 20. Data Migration Path

Actual row data is **not translated through CrackSQL**.

The data migration path is separate from SQL translation.

```text
                    SOURCE POSTGRESQL
                           │
                           ▼
                    Batch Reader
                           │
                           ▼
                 Data Transformation
                           │
                           ▼
                    Batch Writer
                           │
                           ▼
                      TARGET MYSQL
```

## Batch Reader

Reads source rows in controlled batches.

## Data Transformer

Applies deterministic data conversions required by the approved migration decisions.

Examples include:

- Numeric conversion
- Date/time conversion
- Boolean representation
- Null handling
- String conversion
- Auto-generated key handling where required

Ambiguous transformations can be escalated to the Analysis/Transformation workflow before migration begins.

## Batch Writer

Writes transformed records to MySQL using parameterized database operations.

CrackSQL is not involved in ordinary row copying.

---

# 21. Migration Planner

The Planning Agent combines:

- Source metadata
- Analysis decisions
- Dependency graph
- Transformation results
- Validation requirements
- Risk information

It produces the complete migration plan.

Example:

```text
1. Create independent tables
2. Create dependent tables
3. Load parent table data
4. Load child table data
5. Apply/verify foreign keys
6. Create indexes
7. Run validation
8. Run verification
```

The exact order is calculated from dependencies and migration requirements rather than manually entered by the user.

---

# 22. Migration Plan Structure

Conceptually:

```text
MigrationPlan
│
├── source
├── target
├── included_objects
├── excluded_objects
├── datatype_mappings
├── transformation_rules
├── dependency_order
├── schema_steps
├── data_steps
├── constraint_steps
├── index_steps
├── batch_configuration
├── validation_strategy
├── risk_items
├── manual_review_items
└── estimated_execution_information
```

The plan is persisted in Application PostgreSQL.

---

# 23. Human-in-the-Loop Plan Review

The user must approve the migration plan before actual migration begins.

The UI provides:

```text
Migration Plan
────────────────────────────

Source: PostgreSQL
Target: MySQL

Tables: 50
Columns: 620
Indexes: 94
Foreign Keys: 61

Low-risk decisions: 47
High-risk decisions: 3

[Modify]
[Approve]
[Reject]
```

The system is highly autonomous, but human approval is the final gate before high-impact migration execution.

---

# 24. Plan Modification Workflow

The user can modify any supported migration decision.

```text
User edits decision
        ↓
Identify affected components
        ↓
Re-run affected analysis/agents
        ↓
Recalculate dependent decisions
        ↓
Regenerate affected SQL/plan sections
        ↓
Validate updated plan
        ↓
Show revised plan
```

The modification is not silently accepted.

If the requested change is invalid:

```text
User modification
       ↓
Validation
       ↓
Invalid
       ↓
Reject modification
       ↓
Explain reason
       ↓
Keep previous valid plan
```

Example:

```text
Requested:
SERIAL → VARCHAR

Rejected:
Column is a primary key and is referenced by foreign keys
that require a compatible key representation.
```

---

# 25. Validation Agent

Validation is primarily deterministic.

The Validation Agent coordinates deterministic validation tools and interprets the results.

Validation can include:

- Row counts
- Null counts
- Primary key presence
- Foreign key presence
- Constraint checks
- Data type checks
- Aggregate comparisons
- Sample record comparisons
- Data quality checks
- Target object existence

Example:

```text
Source PostgreSQL        Target MySQL

customers: 100,000   →   100,000       ✓
orders:    500,000   →   500,000       ✓
NULL count: 2,341    →   2,341         ✓
```

The LLM should not calculate these values. Database queries and deterministic comparison code should do that.

---

# 26. Testing Agent

The Testing Agent creates and executes migration compatibility and verification tests.

Examples:

```text
✓ Target table exists
✓ Column count matches
✓ Datatypes are compatible
✓ Primary key exists
✓ Foreign keys exist
✓ Indexes exist
✓ Row count matches
✓ NULL count matches
✓ Sample records match
✓ Required objects exist
```

Testing failures are stored as structured test results.

Where remediation is possible, the workflow can send the failure context back through the Knowledge/Analysis/Transformation workflow.

---

# 27. Migration Agent

The Migration Agent executes the approved migration plan.

It coordinates:

```text
Migration Plan
      ↓
Schema execution
      ↓
Data migration
      ↓
Constraints
      ↓
Indexes
      ↓
Verification
```

The agent does not itself perform low-level database operations. It invokes deterministic migration tools.

---

# 28. Batch Migration

V1 uses batch-based migration.

Example:

```text
users
 ├── Batch 1   ✓
 ├── Batch 2   ✓
 ├── Batch 3   ✓
 ├── Batch 4   ✓
 └── Batch 5   RUNNING
```

Batch size is configurable through the migration plan.

The system records the status of each batch.

---

# 29. Retry and Failure Handling

A failed batch is automatically retried.

```text
Batch
  ↓
Failure
  ↓
Retry
  ↓
Success → Continue
```

If automatic retry does not resolve the problem:

```text
Batch Failure
      ↓
Migration Paused
      ↓
Error shown to user
      ↓
Human intervention
      ↓
Resume / appropriate recovery action
```

For broader serious runtime failures, the system attempts safe automatic remediation first. If remediation cannot safely resolve the issue, the migration pauses and asks the user for intervention.

Rollback is treated as a recovery capability rather than the central V1 workflow.

---

# 30. Persistent Checkpointing

Migration progress is persisted in Application PostgreSQL.

Example:

```text
migration_batches

job_id | table | batch | status
--------------------------------
101    | users | 1     | SUCCESS
101    | users | 2     | SUCCESS
101    | users | 3     | SUCCESS
101    | users | 4     | SUCCESS
101    | users | 5     | RUNNING
```

If the application or server fails:

```text
Application failure
       ↓
Application restart
       ↓
Read latest checkpoint
       ↓
Determine completed work
       ↓
Resume from next required batch
```

Completed batches are not unnecessarily repeated.

Checkpointing should be updated transactionally with the relevant migration progress wherever practical.

---

# 31. Verification Agent

After migration, the Verification Agent confirms the resulting target database state.

It compares source and target using deterministic checks.

```text
Source PostgreSQL
       │
       ├── Row count
       ├── Null count
       ├── Aggregates
       └── Samples
              │
              ▼
        Verification Engine
              │
              ▼
       Target MySQL
```

The final verification result becomes part of the migration report.

---

# 32. Live Migration Progress

The UI displays live migration status.

Conceptually:

```text
Migration: PostgreSQL → MySQL

Discovery          ✓
Analysis           ✓
Planning           ✓
Approval           ✓
Schema             ✓
Data Migration     RUNNING
Verification       WAITING

customers          ██████████ 100%
orders             ███████░░░  72%
order_items        ░░░░░░░░░░   0%

Batches
Success: 7,231
Failed:  2
Retries: 4

Current table: orders
Current batch: 7,232
Status: RUNNING
```

The exact live-update transport mechanism can be selected during implementation; the architecture only requires that FastAPI exposes current persisted workflow/migration state to Streamlit.

---

# 33. Authentication and User Isolation

V1 includes basic:

- Signup
- Login
- User-specific migration history

Each migration job belongs to a user.

Conceptually:

```text
User
 │
 ├── Migration Job 1
 ├── Migration Job 2
 └── Migration Job 3
```

A user has at most one active migration job in V1.

---

# 34. Application Data Model

The Application PostgreSQL database should contain structured records for at least:

```text
users
migration_jobs
source_metadata
migration_decisions
migration_plans
plan_modifications
workflow_state
migration_steps
migration_batches
migration_errors
approvals
validation_results
test_results
verification_results
migration_reports
```

The exact relational schema can be designed during implementation.

PGVector remains logically separated as the knowledge retrieval layer even though it is hosted in the same PostgreSQL deployment.

---

# 35. Error Model

Errors should be structured rather than only stored as raw strings.

Conceptually:

```text
MigrationError
├── job_id
├── stage
├── component
├── object_name
├── batch_id
├── error_type
├── message
├── retryable
├── remediation_attempted
├── status
└── created_at
```

Sensitive credentials must never be included in error messages or traces.

---

# 36. Observability

Two observability layers are used.

## 36.1 LLM / Agent observability

```text
LangGraph / Agents / LLM calls
             ↓
      LangSmith / LangFuse
```

Tracks:

- Agent execution
- LLM calls
- Tool calls
- Workflow transitions
- Latency
- Errors
- Reasoning-related metadata appropriate for debugging

Sensitive database credentials must be excluded or redacted.

## 36.2 System / Application observability

```text
FastAPI
Workers
Databases
Migration Engine
      ↓
 Prometheus
      ↓
  Grafana
```

Tracks metrics such as:

- API latency
- Application health
- Migration throughput
- Batch duration
- Batch failures
- Retry counts
- Database metrics
- Resource utilization

---

# 37. Security Principles

The architecture must treat database credentials and migration data as sensitive.

Key principles:

- Source DB access is read-only.
- Credentials are not stored in LLM prompts.
- Credentials are not written to logs.
- Credentials are not written to agent traces.
- SQL execution uses parameterized operations where applicable.
- Target operations are gated by the approved migration plan.
- User migration history is isolated by user/job ownership.
- High-impact migration execution requires explicit approval.

For local V1, secrets should be supplied through secure environment/configuration mechanisms rather than hardcoded in source code.

---

# 38. Deterministic vs Agentic Responsibilities

This separation is a core architectural rule.

| Task | Preferred mechanism |
|---|---|
| Read DB metadata | Deterministic DB tools |
| Build dependency graph | Deterministic code |
| Count rows | Deterministic DB query |
| Read migration batches | Deterministic DB driver |
| Write migration batches | Deterministic DB driver |
| Checkpoint migration | Deterministic application code |
| Retry failed batch | Deterministic workflow/tool |
| Compare validation values | Deterministic code |
| Interpret ambiguous datatype mapping | Agent + RAG |
| Reason about migration risks | Agent + RAG |
| Complex SQL transformation | Transformation Agent + CrackSQL/LLM where appropriate |
| Generate structured migration decisions | Analysis Agent |
| Determine migration strategy | Planning Agent |
| Explain failures / remediation | Agent + Knowledge Agent |
| Human approval decision | User |

The purpose is to avoid creating an unreliable architecture where an LLM is responsible for operations that can be performed exactly with conventional software.

---

# 39. Tool Layer

Agents interact with the actual environment through explicit tools.

Conceptual tool categories:

```text
Database Tools
├── Source Metadata Reader
├── Source Batch Reader
├── Target DDL Executor
├── Target Batch Writer
└── Target Metadata Reader

Migration Tools
├── Dependency Analyzer
├── DDL Generator
├── Data Transformer
├── Validation Engine
├── Test Runner
├── Checkpoint Manager
└── Report Generator

AI / Knowledge Tools
├── Knowledge Agent
├── PGVector Retriever
└── CrackSQL
```

Tools should expose structured inputs and outputs so that LangGraph can reliably use them.

---

# 40. End-to-End Detailed Flow

## Phase 1 — Create migration job

```text
User logs in
   ↓
Creates migration
   ↓
Provides PostgreSQL source connection
   ↓
Provides MySQL target connection
   ↓
FastAPI creates migration job
   ↓
LangGraph workflow starts
```

## Phase 2 — Discovery

```text
Source PostgreSQL
      ↓
Discovery tools
      ↓
Database Inventory
      ↓
Application PostgreSQL
```

## Phase 3 — Analysis

```text
Database Inventory
      ↓
Analysis Agent
      ↓
Knowledge Agent when required
      ↓
Migration Decisions
```

## Phase 4 — Planning

```text
Migration Decisions
      +
Dependency Graph
      ↓
Planning Agent
      ↓
Migration Plan
```

## Phase 5 — SQL generation

```text
Migration Plan
      ↓
DDL Generator
      ↓
Generated SQL
      ↓
CrackSQL where applicable
      ↓
Target SQL
      ↓
Target DDL Executor
```

## Phase 6 — Validation and testing

```text
Target SQL / Migration Plan
      ↓
Validation Agent
      ↓
Testing Agent
      ↓
Validation + Test Results
```

## Phase 7 — Human review

```text
Plan + Results
      ↓
Streamlit
      ↓
User
 ┌────┼────────┐
 ▼    ▼        ▼
Approve Modify Reject
        │
        ▼
Affected analysis re-runs
        ↓
Plan regenerated and validated
```

## Phase 8 — Migration

```text
Approved Plan
      ↓
Migration Agent
      ↓
Create/prepare target schema
      ↓
Batch Reader
      ↓
Data Transformer
      ↓
Batch Writer
      ↓
Checkpoint
      ↓
Next batch
```

## Phase 9 — Verification

```text
Completed migration
      ↓
Verification Agent
      ↓
Deterministic source/target comparison
      ↓
Final report
```

---

# 41. Failure and Recovery Flow

```text
Migration operation
      ↓
     Error
      ↓
Is it safely retryable?
   ┌──┴──┐
  YES    NO
   │      │
   ▼      ▼
 Retry   Safe remediation?
   │       ┌──┴──┐
   │      YES    NO
   │       │      │
   │       ▼      ▼
   │    Remediate Pause
   │       │      │
   └───┬───┘      ▼
       │       Human intervention
       ▼
     Continue / Resume
```

The system should not automatically make destructive or high-impact recovery decisions without the appropriate approval.

---

# 42. Migration Report

The final report should provide a structured summary such as:

```text
Migration Report
──────────────────────────────
Source: PostgreSQL
Target: MySQL
Job ID: 101

Objects discovered: 120
Tables migrated: 50
Columns migrated: 620
Indexes migrated: 94
Foreign keys migrated: 61
Rows migrated: 2,500,000

Validation
──────────
Row counts: PASS
Null counts: PASS
Primary keys: PASS
Foreign keys: PASS
Indexes: PASS
Sample records: PASS

Errors
──────
Batch failures: 2
Retries: 4
Unresolved: 0

Final Status: SUCCESS
```

Reports are stored in Application PostgreSQL and associated with the migration job.

---

# 43. Local V1 Deployment

The first implementation is intended to run locally using Docker.

```text
                         Docker Environment

 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │  ┌────────────┐       ┌────────────┐                    │
 │  │ Streamlit  │──────▶│  FastAPI   │                    │
 │  └────────────┘       └─────┬──────┘                    │
 │                             │                            │
 │                             ▼                            │
 │                      ┌─────────────┐                     │
 │                      │ LangGraph   │                     │
 │                      │ Orchestrator│                     │
 │                      └──────┬──────┘                     │
 │                             │                            │
 │              ┌──────────────┼──────────────┐             │
 │              ▼              ▼              ▼             │
 │          Agent Layer   Tool Layer     Knowledge Layer   │
 │                                            │             │
 │                                            ▼             │
 │                                      PGVector            │
 │                                                          │
 │  ┌────────────────────┐       ┌─────────────────────┐  │
 │  │ App PostgreSQL     │       │ Migration Runtime    │  │
 │  │ + PGVector         │       │ / workers/tools      │  │
 │  └────────────────────┘       └─────────────────────┘  │
 │                                                          │
 └──────────────────────────────────────────────────────────┘
          │                                  │
          ▼                                  ▼
 PostgreSQL Source                    MySQL Target
   READ ONLY                           READ / WRITE
```

Docker Compose can be used initially to run the application components and local supporting services.

---

# 44. Future Deployment Path

The V1 architecture should not depend on a specific deployment environment.

Future path:

```text
Local Docker
     ↓
Dockerized Services
     ↓
Kubernetes
     ↓
AWS
     ↓
Terraform
     ↓
GitHub Actions CI/CD
```

The proposed production stack can use AWS services and Kubernetes without changing the logical migration architecture.

---

# 45. Extensibility for Future Database Pairs

Although V1 is PostgreSQL → MySQL, the architecture should avoid embedding the entire migration system around those two database names.

Conceptually:

```text
                 Migration Engine
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   PostgreSQL        MySQL         Future DB
     Adapter         Adapter         Adapter
```

Database-specific capabilities should be isolated in adapters, tools, knowledge context and transformation components.

Future examples may include:

```text
Oracle → PostgreSQL
SQL Server → PostgreSQL
MySQL → PostgreSQL
```

The core workflow should remain:

```text
Discover
  ↓
Analyse
  ↓
Plan
  ↓
Transform
  ↓
Generate
  ↓
Validate
  ↓
Test
  ↓
Approve
  ↓
Migrate
  ↓
Verify
```

---

# 46. Future Object Support

V1 focuses on tables and data, but discovery already identifies additional database objects.

Future transformation modules can add support for:

```text
Views
Functions
Stored Procedures
Triggers
Sequences
Complex SQL
```

The architecture should allow object-specific transformers to be plugged into the transformation pipeline without redesigning the entire system.

---

# 47. Key Architectural Decisions

| Decision | V1 choice |
|---|---|
| Migration direction | PostgreSQL → MySQL |
| Product vision | Generalized migration platform |
| V1 focus | Accurate core migration |
| Source | Existing PostgreSQL, read-only |
| Target | Existing empty MySQL, read/write |
| UI | Streamlit |
| Backend | FastAPI |
| Orchestration | LangGraph central orchestrator |
| Architecture | Multiple specialized agents |
| Agent autonomy | Highly autonomous |
| Human intervention | High-risk decisions / serious failures |
| Plan approval | Required before migration |
| Plan editing | Supported |
| Invalid modification | Rejected with explanation |
| Application DB | PostgreSQL |
| Vector DB | PGVector |
| RAG access | Dedicated Knowledge Agent |
| SQL translation | CrackSQL where applicable |
| Data movement | Deterministic DB tools |
| DDL generation | Deterministic generator from structured decisions |
| Data migration | Batch-based |
| Checkpointing | Persistent |
| Failure handling | Retry + safe remediation + HITL |
| Observability | LangSmith/LangFuse + Prometheus/Grafana |
| Initial deployment | Local Docker |
| Future deployment | Kubernetes/AWS/Terraform/GitHub Actions |

---

# 48. Core Architectural Principle

The most important rule for implementation is:

> **Use deterministic code/tools wherever a task can be reliably deterministic. Use agents and LLMs only where reasoning, interpretation or ambiguity is actually required.**

Therefore:

```text
Metadata extraction          → Deterministic
Dependency graph             → Deterministic
DDL construction             → Deterministic
SQL dialect translation     → CrackSQL / specialized transformation
Batch reading                → Deterministic
Data transformation          → Deterministic where rules are known
Batch writing                → Deterministic
Retry                        → Deterministic
Checkpointing                → Deterministic
Row-count validation         → Deterministic

Ambiguous conversion        → Agent + Knowledge Agent
Migration risk analysis     → Agent + RAG
Migration strategy          → Planning Agent
Complex SQL reasoning       → Transformation Agent + tools
Failure interpretation      → Agent + Knowledge Agent
Human approval              → User
```

This gives V1 an architecture that is **agentic without making the system unnecessarily dependent on LLM behavior for exact database operations**.
