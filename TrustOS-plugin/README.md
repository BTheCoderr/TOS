# THAS Company Verification Plugin

A Node.js plugin for verifying company information using multiple data sources.

## Features

- Company verification using OpenCorporates API
- Caching with Redis for improved performance
- MongoDB storage for verification results
- RESTful API endpoints
- Extensible architecture for adding more verification sources

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd thas-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the variables with your configuration

## Configuration

Update the `.env` file with your settings:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/thas-plugin
REDIS_URL=redis://localhost:6379
OPENCORPORATES_API_URL=https://api.opencorporates.com/v0.4
OPENCORPORATES_API_KEY=your_api_key_here
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Verify Company
```
POST /api/companies/verify
Content-Type: application/json

{
  "companyName": "Example Corp",
  "registrationNumber": "12345678"
}
```

### Get Verification Status
```
GET /api/companies/:registrationNumber
```

## License

ISC 