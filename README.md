# NestJS AWS Event Lab

A learning project for event-driven architecture with:
- NestJS API
- DynamoDB
- SNS -> SQS fan-out
- Worker-based async processing
- Kafka publishing (local Redpanda)
- Terraform IaC
- GitHub Actions CI/CD

This README is written as a guided lab for beginner AWS programmers.

## 1) What You Will Learn

1. How an HTTP request turns into a durable event flow.
2. How DynamoDB stores state transitions.
3. How SNS publishes and SQS consumes asynchronously.
4. How a worker pushes messages into Kafka.
5. How Terraform defines AWS resources as code.
6. How CI/CD validates and deploys changes.

## 2) Beginner Learning Path

Follow this order. Each step builds on the previous one.

1. Understand the architecture and event lifecycle.
2. Prepare your personal AWS account access for CLI and Terraform.
3. Provision DynamoDB, SNS, and SQS with Terraform.
4. Run local Kafka (Redpanda), then run API and worker.
5. Send one event and observe status transitions end to end.
6. Learn how CI/CD and deployment are wired.

## 3) Architecture

Client
  -> NestJS API
      -> DynamoDB (hello-events)
      -> SNS (hello-events-created)
          -> SQS (hello-events-created-queue)
              -> Worker
                  -> Kafka topic (hello-events)
                  -> DynamoDB status update

## 4) Prerequisites

- Node.js 20+ recommended
- npm
- Docker Desktop
- Terraform 1.6+
- AWS CLI authenticated to your account

If you use a personal AWS account, you do not need corporate SSO setup.

Your GitHub identity for this repo:
- rru.jju@gmail.com

## 5) Configure Git Identity

Run once in this repo:

```bash
git config user.email "rru.jju@gmail.com"
git config user.name "Rru Jju"
```

Verify:

```bash
git config --get user.email
git config --get user.name
```

## 6) AWS Setup for Beginners (Personal Account)

### 6.1 Create an IAM user for CLI access

Use an IAM user, not the root account.

1. In AWS Console, open IAM.
2. Create or select a user for programmatic use.
3. In Security credentials, create an Access key for CLI.
4. Save Access Key ID and Secret Access Key.

Note: Secret Access Key is shown once only.

### 6.2 Configure a named AWS profile

Use a dedicated profile for this lab:

```bash
aws configure --profile nestjs-aws-lab
```

Enter:
- AWS Access Key ID: from IAM user
- AWS Secret Access Key: from IAM user
- Default region name: us-east-1
- Default output format: json

### 6.3 Verify identity and account

```bash
aws sts get-caller-identity --profile nestjs-aws-lab
```

Confirm the Account value matches your personal AWS account.

### 6.4 Set shell environment for this repo session

```bash
export AWS_PROFILE=nestjs-aws-lab
export AWS_REGION=us-east-1
```

Verify:

```bash
aws configure list
aws sts get-caller-identity
```

## 7) Install Dependencies

```bash
npm ci
```

## 8) Environment Variables

Copy .env.example to .env and fill values after terraform apply:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE_NAME=hello-events
SNS_TOPIC_ARN=
SQS_QUEUE_URL=
KAFKA_BROKERS=localhost:19092
KAFKA_CLIENT_ID=hello-events-app
KAFKA_TOPIC=hello-events
PORT=3000
```

Tip for profile-based auth:
- If you use AWS_PROFILE, you can keep AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY empty in .env.

## 9) Provision Infrastructure with Terraform (IaC)

Why IaC:
- Repeatable provisioning
- Version-controlled infrastructure
- Safer changes through plan/apply workflow

Commands:

```bash
cd terraform
terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
```

Get outputs and map them into your .env:

```bash
terraform output
```

Use these outputs:
- dynamodb_table_name -> DYNAMODB_TABLE_NAME
- sns_topic_arn -> SNS_TOPIC_ARN
- sqs_queue_url -> SQS_QUEUE_URL
- aws_region -> AWS_REGION

Beginner checkpoint after apply:
1. Open DynamoDB and confirm table hello-events exists.
2. Open SNS and confirm topic hello-events-created exists.
3. Open SQS and confirm queue hello-events-created-queue exists.

## 10) Start Local Kafka (Redpanda)

```bash
docker compose -f docker/docker-compose.kafka.yml up -d
```

Kafka broker endpoint for app:
- localhost:19092

Optional UI:
- http://localhost:8080

## 11) Run API and Worker

Terminal 1 (API):

```bash
npm run start:dev
```

Terminal 2 (Worker):

```bash
npm run start:worker:dev
```

## 12) Test End-to-End

Create event:

```bash
curl -X POST http://localhost:3000/hello-events \
  -H "Content-Type: application/json" \
  -d '{"message":"hello world"}'
```

Get event (replace ID):

```bash
curl http://localhost:3000/hello-events/<id>
```

Health:

```bash
curl http://localhost:3000/health
```

Expected lifecycle:
1. API writes DynamoDB with CREATED.
2. API publishes SNS and updates status to SNS_PUBLISHED.
3. Worker receives SQS message.
4. Worker publishes to Kafka and updates status to KAFKA_PUBLISHED.

Beginner observation checklist:
1. API logs show DynamoDB write and SNS publish success.
2. Worker logs show SQS receive and delete success.
3. Worker logs show Kafka publish success.
4. GET endpoint returns latest event status.

## 13) Learn the Codebase in Small Steps

Start in this order:
1. API bootstrap and module wiring: src/main.ts, src/app.module.ts
2. HTTP endpoints: src/hello-events/hello-events.controller.ts
3. Business flow: src/hello-events/hello-events.service.ts
4. DynamoDB access: src/hello-events/hello-events.repository.ts
5. SNS publishing: src/messaging/sns.publisher.ts
6. SQS polling and processing: src/messaging/sqs.consumer.ts
7. Kafka publishing: src/messaging/kafka.publisher.ts
8. Worker entrypoint: worker/main.ts, worker/worker.module.ts
9. Terraform resources: terraform/*.tf
10. Local Kafka compose: docker/docker-compose.kafka.yml
11. CI pipeline: .github/workflows/ci.yml
12. Deploy pipeline: .github/workflows/deploy.yml

## 14) Push to Git and Configure GitHub Actions Deploy

You already validated local behavior through Step 13. Now move to GitHub and deployment.

### 14.1 Create GitHub repository and push your code

If this folder is not yet a git repository:

```bash
cd /path/to/nestjs-aws-event-lab
git init
git branch -M main
```

Create your first commit:

```bash
git add .
git commit -m "chore: initial event lab setup"
```

Create a repository in GitHub, then connect and push:

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 14.2 Understand what CI and Deploy workflows do

CI workflow (.github/workflows/ci.yml):
1. npm ci
2. npm run lint
3. npm run build
4. npm test
5. terraform fmt -check -recursive
6. terraform init -backend=false
7. terraform validate

Deploy workflow (.github/workflows/deploy.yml):
1. Assume AWS role via GitHub OIDC
2. Build and push Docker image to ECR
3. Run terraform apply
4. SSH to EC2, pull image, restart container

### 14.3 Create AWS OIDC role for GitHub Actions

In your AWS account:
1. Create IAM OIDC identity provider for token.actions.githubusercontent.com (if not already present).
2. Create an IAM role trusted by GitHub OIDC for your repository.
3. Allow sts:AssumeRoleWithWebIdentity from your repo/branch conditions.

Minimum role capabilities for this lab:
1. ECR push and pull permissions.
2. Terraform target resources (DynamoDB, SNS, SQS, IAM-related actions used by your tf code).
3. Optional: least privilege scoped to lab resources.

### 14.4 Prepare EC2 host for runtime deployment

Your deploy workflow SSHes into EC2 and runs docker commands. Ensure EC2 has:
1. Docker installed and running.
2. AWS CLI installed.
3. Permission to pull from ECR (instance profile or aws configure on the host).
4. Runtime env file present at /opt/hello-events/.env.

Create host env file:

```bash
sudo mkdir -p /opt/hello-events
sudo tee /opt/hello-events/.env >/dev/null <<'EOF'
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=hello-events
SNS_TOPIC_ARN=<terraform-output-sns-topic-arn>
SQS_QUEUE_URL=<terraform-output-sqs-queue-url>
KAFKA_BROKERS=<your-runtime-kafka-broker>
KAFKA_CLIENT_ID=hello-events-app
KAFKA_TOPIC=hello-events
PORT=3000
EOF
```

### 14.5 Configure GitHub repository secrets and variables

In GitHub repository settings:

Secrets:
1. AWS_ROLE_TO_ASSUME
2. EC2_SSH_PRIVATE_KEY

Variables:
1. AWS_REGION (example: us-east-1)
2. ECR_REPOSITORY (example: hello-events-api)
3. EC2_HOST (public DNS or IP)
4. EC2_USER (example: ec2-user or ubuntu)

### 14.6 Trigger deploy

Deploy runs automatically on push to main, or manually via workflow_dispatch.

Manual trigger path:
1. GitHub -> Actions -> Deploy workflow
2. Click Run workflow
3. Select branch main

## 15) Branch and PR Workflow (Daily Development)

Create and push a feature branch:

```bash
git checkout -b feat/<short-description>
git add .
git commit -m "feat: <what changed>"
git push -u origin feat/<short-description>
```

Then in GitHub:
1. Open a PR from feat/* to main.
2. Wait for CI to pass.
3. Squash merge to main.
4. Confirm Deploy workflow starts after merge.

## 16) Post-Deploy Verification

### 16.1 Verify workflows

1. CI workflow shows green on PR and/or merge commit.
2. Deploy workflow shows green on main.
3. Deploy logs show successful ECR push, terraform apply, and SSH docker run.

### 16.2 Verify service on EC2

SSH into EC2:

```bash
docker ps
docker logs --tail 200 hello-events-api
```

Validate endpoint from your machine:

```bash
curl http://<EC2_HOST>:3000/health
```

If reachable, test event creation against EC2-hosted API:

```bash
curl -X POST http://<EC2_HOST>:3000/hello-events \
  -H "Content-Type: application/json" \
  -d '{"message":"from deployed api"}'
```

## 17) Troubleshooting for Starters

1. AWS error: Unable to locate credentials (local)
   - Ensure AWS_PROFILE is set to nestjs-aws-lab in your shell.
   - Run aws sts get-caller-identity to confirm active credentials.

2. AccessDenied in GitHub Actions
   - Check AWS_ROLE_TO_ASSUME secret value.
   - Check OIDC trust policy for correct repo and branch.
   - Check IAM permissions attached to the role.

3. Terraform apply fails in Deploy workflow
   - Run terraform validate locally in terraform/.
   - Confirm AWS_REGION variable is set in GitHub.
   - Confirm role has permissions for DynamoDB/SNS/SQS resources.

4. Deploy succeeds but container is not running on EC2
   - Check docker ps and docker logs on EC2.
   - Confirm /opt/hello-events/.env exists and has valid values.
   - Confirm EC2 can authenticate to ECR.

5. Worker not processing messages (local)
   - Confirm SQS_QUEUE_URL is a URL, not an ARN.
   - Confirm worker process is running.

6. Kafka connection errors (local)
   - Start Redpanda with docker compose.
   - Confirm KAFKA_BROKERS is localhost:19092.

## 18) Cleanup

Destroy AWS resources:

```bash
cd terraform
terraform destroy
```

Then stop local Kafka:

```bash
docker compose -f docker/docker-compose.kafka.yml down
```

## 19) Cost Notes

- DynamoDB, SNS, and SQS are low-cost at learning scale.
- EC2 and ECR add baseline monthly cost; stop instances when not needed.
- Local Redpanda avoids MSK cost while learning Kafka patterns.
- If you move Kafka to AWS MSK, cost and setup complexity increase significantly.
