import { Module } from '@nestjs/common';
import { BetaTestingController } from './api/BetaTestingController';
import { VerificationService } from './services/VerificationService';
import { FeedbackService } from './services/FeedbackService';
import { MetricsCollector } from './services/MetricsCollector';
import { LinkedInVerificationService } from './services/LinkedInVerificationService';
import { FeedbackCollector } from './services/FeedbackCollector';

@Module({
  controllers: [BetaTestingController],
  providers: [
    VerificationService,
    FeedbackService,
    MetricsCollector,
    LinkedInVerificationService,
    FeedbackCollector
  ],
  exports: [
    VerificationService,
    FeedbackService,
    MetricsCollector
  ]
})
export class BetaModule {} 