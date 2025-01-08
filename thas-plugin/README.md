# TrustOS

TrustOS is a company verification and trust scoring platform that helps validate job postings and companies through multiple data sources, including LinkedIn integration.

## Features

- 🔍 **Company Verification**: Multi-source verification using LinkedIn and other data providers
- 📊 **Trust Scoring**: Advanced algorithms to calculate company trust scores
- 🤖 **ML Analysis**: Machine learning-based analysis for tech job postings
- 📈 **Beta Testing**: Comprehensive beta testing framework with metrics collection
- 🔄 **Real-time Monitoring**: Performance and usage metrics tracking

## Quick Start

1. **Installation**

```bash
git clone https://github.com/yourusername/trustos.git
cd trustos
npm install
```

2. **Configuration**

Create a `.env` file in the root directory:

```env
PORT=3000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/trustos
REDIS_URL=redis://localhost:6379
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
```

3. **Running the Application**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Documentation

Once the application is running, visit `http://localhost:3000/api` to access the Swagger documentation.

### Key Endpoints

- `POST /beta/test`: Run verification test on a job posting
- `POST /beta/feedback`: Submit beta testing feedback
- `GET /beta/metrics`: Get beta testing metrics
- `GET /beta/features`: List available beta features

## Architecture

TrustOS follows a modular architecture:

```
src/
├── api/           # API Controllers
├── services/      # Business Logic
├── models/        # Data Models
├── types/         # TypeScript Types
├── dto/           # Data Transfer Objects
└── utils/         # Utilities
```

## Beta Testing

To participate in beta testing:

1. Register for a beta account
2. Obtain API credentials
3. Integrate with your job board
4. Monitor metrics in the dashboard
5. Provide feedback through the API

## Development

```bash
# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [trustos.dev](https://trustos.dev)
- Email: support@trustos.dev
- Twitter: [@trustos_dev](https://twitter.com/trustos_dev)

## Acknowledgments

- LinkedIn API Documentation
- NestJS Framework
- MongoDB
- Redis 