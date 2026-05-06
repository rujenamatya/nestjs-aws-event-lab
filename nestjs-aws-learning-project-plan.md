# NestJS AWS Learning Project Plan

## Purpose

Create a small, self-contained learning project that demonstrates the same core patterns used in this repository, but with minimal business logic:

- NestJS HTTP API
- one DynamoDB table
- SNS topic publishing
- SQS queue consumption
- Kafka publishing
- Dockerized app and worker processes
- Terraform-managed infrastructure

This plan is intentionally implementation-ready so another agent can build it without re-discovering requirements.

## Project Goal

Build a "hello world events" application where:

1. An HTTP endpoint creates a simple message record in DynamoDB.
2. The app publishes a domain event to SNS.
3. SNS fans out to SQS.
4. A worker process polls SQS and publishes a simplified event to Kafka.
5. Everything is containerized with Docker and provisioned with Terraform in a personal AWS account.

The learning objective is not business complexity. The learning objective is understanding the interaction between:

- API layer
- persistence layer
- async event flow
- worker process
- AWS IAM and resource wiring
- Terraform outputs and app configuration

## Recommended Name

Use a separate standalone repository or workspace named something like:

- `nestjs-aws-event-lab`
- `nestjs-hello-events`
- `hello-nest-aws-messaging`

Do not build this inside `eis-rmas`.

## Scope

### In scope

- One NestJS API service
- One NestJS-based worker entrypoint or lightweight Node worker in same repo
- One DynamoDB table
- One SNS topic
- One SQS queue subscribed to SNS
- One dead-letter queue for SQS
- One Kafka producer flow
- Terraform for all AWS infrastructure except Kafka if Kafka is kept outside AWS
- Dockerfile for API and worker
- Basic Git workflow for clone/pull/push and branching
- Basic GitHub Actions CI and CD deployment pipeline
- Minimal README with run, deploy, and test steps

### Out of scope

- Multi-service microservice architecture
- Complex auth or RBAC
- Production hardening
- Kubernetes deployment
- Advanced retry or replay tooling
- Schema registry

## Core Learning Use Case

Use a single entity called `HelloEvent`.

Suggested shape:

```ts
type HelloEvent = {
  id: string
  message: string
  createdAt: string
  status: 'CREATED' | 'SNS_PUBLISHED' | 'SQS_PROCESSED' | 'KAFKA_PUBLISHED'
}
```

### API behavior

1. `POST /hello-events`
Creates an item in DynamoDB and publishes an SNS message.

2. `GET /hello-events/:id`
Reads the item from DynamoDB.

3. `GET /health`
Simple health endpoint.

### Worker behavior

1. Poll SQS continuously.
2. Parse SNS-wrapped messages.
3. Publish a small transformed payload to Kafka.
4. Optionally update DynamoDB status to `KAFKA_PUBLISHED`.

## Architecture

```text
Client
  -> NestJS API
      -> DynamoDB
      -> SNS Topic
          -> SQS Queue
              -> Worker
                  -> Kafka
                  -> DynamoDB status update
```

## Important Design Choice: Kafka

Kafka is the one part that is not naturally simple in a personal AWS account.

### Recommended default approach

Use AWS for DynamoDB, SNS, and SQS.
Use local Docker for Kafka during learning.

Reason:

- DynamoDB, SNS, and SQS are cheap and simple in AWS.
- Kafka on AWS usually means MSK or MSK Serverless, which is materially more expensive and operationally heavier.
- For learning event flow, a local Kafka broker is enough.

### Option A: Best balance for learning

- AWS: DynamoDB, SNS, SQS, IAM
- Local Docker: Kafka or Redpanda

This should be the default recommendation.

### Option B: Full AWS

- AWS: DynamoDB, SNS, SQS, MSK Serverless

Use only if the user explicitly wants Kafka fully hosted in AWS and accepts higher cost and extra setup.

### Agent instruction

Implement Option A first unless the user explicitly requests hosted Kafka in AWS.

## Technology Choices

### App

- NestJS
- TypeScript
- AWS SDK v3
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/client-sns`
- `@aws-sdk/client-sqs`
- `kafkajs`
- `class-validator`
- `class-transformer`

### Infra

- Terraform
- AWS provider

### Containers

- One Dockerfile with targets or one shared Dockerfile used by API and worker
- Docker Compose for local Kafka only

## Suggested Repository Structure

```text
nestjs-aws-event-lab/
  .github/
    workflows/
      ci.yml
      deploy.yml
  src/
    main.ts
    app.module.ts
    config/
      configuration.ts
    hello-events/
      hello-events.controller.ts
      hello-events.service.ts
      hello-events.repository.ts
      dto/
      model/
    messaging/
      sns.publisher.ts
      sqs.consumer.ts
      kafka.publisher.ts
    health/
      health.controller.ts
    common/
      aws/
      logger/
      errors/
  worker/
    main.ts
  terraform/
    main.tf
    variables.tf
    outputs.tf
    dynamodb.tf
    sns.tf
    sqs.tf
    iam.tf
  docker/
    docker-compose.kafka.yml
  Dockerfile
  package.json
  tsconfig.json
  .env.example
  README.md
```

## Git Workflow Requirements

Use a minimal but clean Git model for learning:

1. `main` is always deployable.
2. Feature work is done in short-lived branches (`feat/*`, `fix/*`).
3. Pull requests are required for merge to `main`.
4. Squash merge is preferred to keep history simple.

### Basic commands to document in README

```bash
git clone <repo-url>
cd nestjs-aws-event-lab
git checkout -b feat/hello-events
git add .
git commit -m "feat: add hello event api"
git push -u origin feat/hello-events
```

## GitHub Actions Requirements

Add two workflows:

1. `ci.yml` (on pull_request and push to main)
2. `deploy.yml` (on push to main, or manual workflow_dispatch)

### CI workflow responsibilities (`ci.yml`)

1. Install dependencies.
2. Lint.
3. Build.
4. Run tests.
5. Validate Terraform format and syntax (`terraform fmt -check`, `terraform validate`).

### Deploy workflow responsibilities (`deploy.yml`)

Keep deployment intentionally simple:

1. Build Docker image.
2. Push image to Amazon ECR.
3. Run `terraform apply` for infra changes.
4. Update runtime target using a simple host strategy.

### Recommended deploy target for simplicity

Use one EC2 instance with Docker Compose for API and worker.

Reason:

- Much easier than ECS for a learning project.
- Still demonstrates automated deploy via GitHub Actions.
- Lets you practice image pull, restart, and env management.

### Deploy workflow implementation notes

Use GitHub OIDC with AWS (no long-lived AWS keys in GitHub secrets).

Required GitHub repo secrets/variables (minimum):

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `ECR_REPOSITORY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_PRIVATE_KEY`
- `TF_STATE_BUCKET` (if using remote tf state)

Agent instruction:

Prefer OIDC role assumption for AWS auth in Actions. Avoid static AWS access keys.

## Terraform Requirements

### AWS resources

1. DynamoDB table
- Name: `hello-events`
- Partition key: `id` (string)
- Billing mode: `PAY_PER_REQUEST`

2. SNS topic
- Name: `hello-events-created`

3. SQS queue
- Name: `hello-events-created-queue`

4. SQS dead-letter queue
- Name: `hello-events-created-dlq`

5. SNS subscription
- Subscribe SQS queue to SNS topic
- Include queue policy allowing SNS to send to SQS

6. IAM policy/user guidance
- Minimal permissions for app credentials:
  - `dynamodb:GetItem`
  - `dynamodb:PutItem`
  - `dynamodb:UpdateItem`
  - `sns:Publish`
  - `sqs:ReceiveMessage`
  - `sqs:DeleteMessage`
  - `sqs:GetQueueAttributes`
  - `sqs:ChangeMessageVisibility`

### Terraform outputs

Output at least:

- DynamoDB table name
- SNS topic ARN
- SQS queue URL
- SQS queue ARN
- AWS region

### Agent instruction

Do not over-engineer Terraform modules. Keep it flat and readable for learning.

## Application Configuration

Use environment variables with an `.env.example` containing:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE_NAME=hello-events
SNS_TOPIC_ARN=
SQS_QUEUE_URL=
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=hello-events-app
PORT=3000
```

If using Dockerized Kafka locally, keep Kafka config local by default.

## NestJS Implementation Plan

### Phase 1: Basic API

1. Create NestJS app.
2. Add config module.
3. Add `HelloEventsController`.
4. Add `HelloEventsService`.
5. Add DynamoDB repository using AWS SDK v3.
6. Implement:
   - `POST /hello-events`
   - `GET /hello-events/:id`
   - `GET /health`

### Phase 2: SNS publishing

1. Add SNS publisher service.
2. After `POST /hello-events`, publish an event:

```json
{
  "type": "HELLO_EVENT_CREATED",
  "id": "<uuid>",
  "message": "hello world",
  "createdAt": "<iso-date>"
}
```

3. Update record status to `SNS_PUBLISHED` only after successful publish.

### Phase 3: SQS worker

1. Add worker entrypoint in `worker/main.ts`.
2. Poll SQS in a loop.
3. Decode SNS envelope.
4. Log the message clearly.
5. Delete SQS message only after successful processing.

### Phase 4: Kafka publishing

1. Add Kafka publisher abstraction.
2. Worker publishes message to Kafka topic such as `hello-events`.
3. Update DynamoDB status to `KAFKA_PUBLISHED`.
4. Keep payload simple and JSON-based.

### Phase 5: Dockerization

1. Multi-stage Dockerfile.
2. API container runs NestJS HTTP server.
3. Worker container runs `node dist/worker/main.js`.
4. Local Docker Compose starts Kafka or Redpanda only.

### Phase 6: GitHub Actions and Deployment

1. Add `.github/workflows/ci.yml`.
2. Add `.github/workflows/deploy.yml`.
3. Add ECR image build and push in deploy workflow.
4. Add simple remote deploy step to EC2 host with Docker Compose pull/restart.
5. Add rollback note (redeploy previous image tag).

## Suggested Docker Strategy

### Dockerfile

One Dockerfile is enough.

Suggested commands:

- API: `node dist/src/main.js`
- Worker: `node dist/worker/main.js`

### Docker Compose

Only for local Kafka.

Suggested stack:

- `redpanda` preferred for simplicity, or plain Kafka if the user specifically wants Kafka classic

Agent instruction:

Prefer Redpanda if the goal is learning event flow quickly. Prefer Kafka if the user wants protocol familiarity over simplicity.

## Minimal API Contract

### Create event

`POST /hello-events`

Request:

```json
{
  "message": "hello world"
}
```

Response:

```json
{
  "id": "uuid",
  "message": "hello world",
  "createdAt": "2026-04-12T00:00:00.000Z",
  "status": "SNS_PUBLISHED"
}
```

### Get event

`GET /hello-events/:id`

Response:

```json
{
  "id": "uuid",
  "message": "hello world",
  "createdAt": "2026-04-12T00:00:00.000Z",
  "status": "KAFKA_PUBLISHED"
}
```

## Error Handling

Keep error handling simple and explicit.

### API

- 400 for invalid request body
- 404 for missing event id
- 500 for AWS/Kafka failures

### Worker

- Log structured errors
- Do not delete failed SQS messages
- Let redrive policy move poison messages to DLQ

## Logging and Observability

Keep this lightweight:

- NestJS logger or pino
- Log request id or event id
- Log AWS publish success/failure
- Log SQS receive/delete actions
- Log Kafka publish success/failure

Do not add OpenTelemetry in the first pass.

## Testing Plan

### Unit tests

- repository service mocks
- SNS publisher mocks
- Kafka publisher mocks
- controller validation tests

### Integration tests

- optional and only if time permits
- can be deferred

### Manual learning tests

1. `terraform apply`
2. run API locally
3. run worker locally
4. `POST /hello-events`
5. verify DynamoDB item created
6. verify SNS message published
7. verify SQS message consumed
8. verify Kafka message produced
9. verify DynamoDB status changed
10. push a change to `main` and verify GitHub Actions deploy updates runtime

## Acceptance Criteria

The project is complete when all of the following are true:

1. `POST /hello-events` creates a record in DynamoDB.
2. The API publishes an SNS event successfully.
3. SNS delivers to SQS.
4. Worker reads from SQS.
5. Worker publishes to Kafka.
6. `GET /hello-events/:id` reflects state transitions.
7. Terraform provisions AWS resources successfully in a personal AWS account.
8. App and worker run via Docker.
9. Push to `main` triggers GitHub Actions deploy successfully.
10. README is sufficient for a new person to run the sample.

## README Requirements For The Future Project

The implementing agent should include these sections:

1. What this project demonstrates
2. Architecture diagram
3. Prerequisites
4. AWS credential setup
5. Terraform apply steps
6. Local Kafka start steps
7. Run API
8. Run worker
9. Test with curl
10. Git workflow (branch, PR, merge)
11. GitHub Actions setup and required secrets
12. Deployment verification steps
13. Clean up with `terraform destroy`
14. Estimated AWS cost notes

## AWS Cost Guidance

Include a warning in the future README:

- DynamoDB, SNS, SQS are cheap for low usage.
- MSK is not cheap.
- Default recommendation should avoid MSK unless explicitly requested.

## Delegation Notes For Another Agent

The implementing agent should follow this order:

1. Scaffold the NestJS app.
2. Add the HelloEvent module and DynamoDB repository.
3. Add Terraform for DynamoDB, SNS, SQS, DLQ.
4. Add SNS publish on create.
5. Add worker with SQS polling.
6. Add Kafka publish.
7. Add Dockerfile and local Kafka compose file.
8. Add GitHub Actions workflows for CI and deploy.
9. Add README and architecture diagram.
10. Verify end-to-end manually, including Actions deployment.

The implementing agent should avoid:

- copying `eis-rmas` complexity
- adding unnecessary layers
- adding multiple databases
- introducing Kubernetes
- introducing custom Nest abstractions unless they make learning clearer

## Nice-To-Have Follow-Up Work

Only after the core project works:

1. Add DLQ inspection endpoint or script.
2. Add message replay script.
3. Add Terraform environments.
4. Add hosted Kafka option with MSK Serverless.
5. Add CloudWatch dashboards.

## Summary

Build a deliberately small learning project that mirrors the main patterns of `eis-rmas`:

- NestJS API
- one DynamoDB table
- SNS -> SQS event fan-out
- worker-based async processing
- Kafka publication
- Docker packaging
- Terraform-managed AWS resources

Keep AWS resources real, keep Kafka local by default, and optimize for clarity over architectural completeness.