# Favorite Color Backend

This is the backend service for the Favorite Color application, built with TypeScript and AWS Lambda.

## Infrastructure

The backend infrastructure is managed using Terraform and includes:

- Lambda Functions for color submission and search
- API Gateway for HTTP endpoints
- DynamoDB table for data storage
- S3 bucket for static website hosting
- CloudFront distribution for CDN
- WAF for security
- ACM certificate for HTTPS
- Route53 DNS configuration

### Prerequisites

- Node.js 18.x
- AWS CLI configured with appropriate credentials
- Terraform 1.x
- AWS account with necessary permissions

### Environment Variables

Required environment variables:
- `AWS_REGION`: AWS region for deployment (default: us-east-1)
- `ENVIRONMENT`: Environment name (dev, test, prod)
- `DOMAIN_NAME`: Domain name for the website
- `ROUTE53_ZONE_ID`: Route53 hosted zone ID

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run type checking:
   ```bash
   npm run type-check
   ```

4. Run tests:
   ```bash
   npm test
   ```

## API Endpoints

### Submit Color
- **Method**: POST
- **Path**: `/colors`
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "favoriteColor": "string"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "firstName": "string",
      "favoriteColor": "string",
      "timestamp": "string"
    },
    "statusCode": 201
  }
  ```

### Search Colors
- **Method**: GET
- **Path**: `/colors`
- **Query Parameters**:
  - `firstName` (optional): Filter results by first name
- **Response**:
  ```json
  {
    "data": [
      {
        "firstName": "string",
        "favoriteColor": "string",
        "timestamp": "string"
      }
    ],
    "statusCode": 200
  }
  ```

## Infrastructure Deployment

1. Navigate to the Terraform directory:
   ```bash
   cd terraform
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Deploy infrastructure:
   ```bash
   terraform apply \
     -var="environment=dev" \
     -var="project_name=favorite-color" \
     -var="domain_name=your-domain.com" \
     -var="route53_zone_id=your-zone-id"
   ```

## CI/CD Pipeline

The backend uses GitHub Actions for CI/CD:

1. **Test Job**:
   - Type checking
   - Unit tests
   - Integration tests

2. **Deploy Job** (main branch only):
   - Build TypeScript
   - Deploy infrastructure with Terraform
   - Update API Gateway

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Project Structure

```
favorite-color-backend/
├── src/
│   ├── functions/          # Lambda function handlers
│   │   ├── submitColor/    # Color submission function
│   │   └── searchColors/   # Color search function
│   └── shared/            # Shared types and utilities
├── tests/                 # Test files
├── terraform/            # Infrastructure as code
└── package.json         # Project dependencies
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

MIT 