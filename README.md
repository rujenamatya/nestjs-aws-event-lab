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

GitHub Actions uses OpenID Connect (OIDC) to securely assume an AWS role without storing credentials.

#### 14.3.1 Create OIDC identity provider (one-time per AWS account)

**Option A: AWS Console**

1. Go to AWS Console → IAM → Identity providers
2. Click "Add provider"
3. Select "OpenID Connect"
4. Provider URL: `https://token.actions.githubusercontent.com`
5. Audience: `sts.amazonaws.com`
6. Click "Add provider"
7. Verify provider now shows in list

**Option B: AWS CLI**

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

#### 14.3.2 Create IAM role for GitHub Actions

**Option A: AWS Console**

1. Go to IAM → Roles → Create role
2. Select trusted entity type: "Web identity"
3. Identity provider: Select `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click "Next"
6. Permissions: Skip for now (we'll add inline policy)
7. Role name: `github-actions-nestjs-aws-lab`
8. Click "Create role"

**Option B: AWS CLI**

First, create trust policy file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<YOUR-AWS-ACCOUNT-ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:rujenamatya/nestjs-aws-event-lab:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Replace `<YOUR-AWS-ACCOUNT-ID>` with your AWS account ID (from `aws sts get-caller-identity`).

Then create the role:

```bash
aws iam create-role \
  --role-name github-actions-nestjs-aws-lab \
  --assume-role-policy-document file://trust-policy.json
```

#### 14.3.3 Attach permissions to the role

Create policy file `role-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPermissions",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:<YOUR-AWS-ACCOUNT-ID>:repository/hello-events-api"
    },
    {
      "Sid": "TerraformDynamoDBPermissions",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:DeleteTable",
        "dynamodb:UpdateTable",
        "dynamodb:ListTables"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:<YOUR-AWS-ACCOUNT-ID>:table/hello-events"
    },
    {
      "Sid": "TerraformSNSPermissions",
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes",
        "sns:ListTopics",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:ListSubscriptionsByTopic"
      ],
      "Resource": "arn:aws:sns:us-east-1:<YOUR-AWS-ACCOUNT-ID>:hello-events-created*"
    },
    {
      "Sid": "TerraformSQSPermissions",
      "Effect": "Allow",
      "Action": [
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:GetQueueAttributes",
        "sqs:SetQueueAttributes",
        "sqs:ListQueues",
        "sqs:PurgeQueue"
      ],
      "Resource": "arn:aws:sqs:us-east-1:<YOUR-AWS-ACCOUNT-ID>:hello-events-created-queue*"
    },
    {
      "Sid": "TerraformIAMPermissions",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:UpdateRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:ListRolePolicies",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile"
      ],
      "Resource": "arn:aws:iam::<YOUR-AWS-ACCOUNT-ID>:role/*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

Replace `<YOUR-AWS-ACCOUNT-ID>` with your AWS account ID.

**Option A: AWS Console**

1. Go to IAM → Roles → Select `github-actions-nestjs-aws-lab`
2. Click "Add permissions" → "Create inline policy"
3. Copy the JSON from `role-policy.json` above into the policy editor
4. Review and create

**Option B: AWS CLI**

```bash
aws iam put-role-policy \
  --role-name github-actions-nestjs-aws-lab \
  --policy-name github-actions-nestjs-aws-lab-policy \
  --policy-document file://role-policy.json
```

#### 14.3.4 Get the role ARN

```bash
aws iam get-role --role-name github-actions-nestjs-aws-lab
```

Look for `Arn` in the output. Example:
```
arn:aws:iam::123456789012:role/github-actions-nestjs-aws-lab
```

Save this ARN—you'll use it as `AWS_ROLE_TO_ASSUME` secret in GitHub.

#### 14.3.5 Verify role is correctly configured

Test the OIDC trust:

1. Go to IAM → Roles → `github-actions-nestjs-aws-lab`
2. Click "Trust relationships" tab
3. Confirm principal is `arn:aws:iam::<ACCOUNT-ID>:oidc-provider/token.actions.githubusercontent.com`
4. Confirm condition restricts to your repo and main branch

Example condition:
```json
"token.actions.githubusercontent.com:sub": "repo:rujenamatya/nestjs-aws-event-lab:ref:refs/heads/main"
```
3. Optional: least privilege scoped to lab resources.

### 14.4 Prepare EC2 host for runtime deployment

#### 14.4.1 Launch EC2 instance

1. Go to AWS Console → EC2 → Launch instances
2. Choose Amazon Linux 2 AMI
3. Instance type: t3.small (eligible for free tier if new account)
4. Advanced details → IAM instance profile: Select the profile created in 14.4.2
5. Security group (new): Allow:
   - SSH (TCP 22) from your IP
   - TCP 3000 from 0.0.0.0/0 (for API)
6. Storage: 20 GB gp3 (default)
7. Launch and save the .pem key file locally

Record the public IP or DNS after launch.

#### 14.4.2 Create IAM instance profile for ECR access

EC2 needs permission to pull Docker images from ECR.

Create a role `hello-events-ec2-role`:
- Trust: EC2 service
- Permission: `AmazonEC2ContainerRegistryPowerUser`

Then create instance profile:

```bash
aws iam create-instance-profile --instance-profile-name hello-events-ec2-profile
aws iam add-role-to-instance-profile \
  --instance-profile-name hello-events-ec2-profile \
  --role-name hello-events-ec2-role
```

(Do this before launching EC2 in 14.4.1, or attach profile after launch)

#### 14.4.3 SSH into EC2 and install Docker + AWS CLI

```bash
# From your machine
chmod 600 /path/to/key.pem
ssh -i /path/to/key.pem ec2-user@<EC2_PUBLIC_IP>

# Once logged in
sudo yum update -y
sudo yum install docker aws-cli -y
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker ps
aws --version
```

#### 14.4.4 Create runtime environment directory and .env file

Get outputs from local machine first:

```bash
cd terraform
terraform output
```

Note the values for `sqs_queue_url` and `sns_topic_arn`.

Then on EC2:

```bash
# Create directory
sudo mkdir -p /opt/hello-events
sudo chown ec2-user:ec2-user /opt/hello-events

# Create .env file (replace placeholders with terraform outputs)
cat > /opt/hello-events/.env <<'EOF'
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=hello-events
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:831622639485:hello-events-created
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/831622639485/hello-events-created-queue
KAFKA_BROKERS=localhost:19092
KAFKA_CLIENT_ID=hello-events-app
KAFKA_TOPIC=hello-events
PORT=3000
EOF

cat /opt/hello-events/.env  # verify content
```

#### 14.4.5 Verify ECR authentication

EC2's IAM role should provide credentials automatically:

```bash
aws ecr get-authorization-token --region us-east-1
```

If successful, you'll see a token. If it fails, check:
- Instance profile is attached to EC2 instance
- Role has ECR permissions
- Instance can access AWS metadata service

**Readiness checklist:**
- [ ] EC2 instance running and public IP accessible
- [ ] Can SSH in: `ssh -i key.pem ec2-user@<IP>`
- [ ] `docker ps` returns empty list (Docker running)
- [ ] `aws --version` works
- [ ] `/opt/hello-events/.env` exists with correct terraform values
- [ ] `aws ecr get-authorization-token` returns a token (no error)

#### 14.4.6 Create ECR repository

Open AWS Console in us-east-1:
1. Go to ECR → Repositories → Create repository
2. Visibility: Private
3. Repository name: `hello-events-api`
4. Keep defaults for the rest
5. Click Create repository

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
