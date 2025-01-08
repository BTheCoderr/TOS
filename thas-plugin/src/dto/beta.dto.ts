import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, IsDate, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class JobPostingDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsOptional()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'])
  employmentType: string;
}

export class SalaryDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;

  @IsString()
  currency: string;
}

export class BetaFeedbackDto {
  @IsString()
  testId: string;

  @IsString()
  userId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comments: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureRequests?: string[];

  @Type(() => Date)
  @IsDate()
  timestamp: Date;
}

export class BetaMetricsFiltersDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userGroups?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testTypes?: string[];
}

export class VerificationResultDto {
  @IsBoolean()
  success: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsNumber()
  timing: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];
} 