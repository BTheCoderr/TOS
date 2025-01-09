import { JobPosting } from '../types/jobPosting';
import { logger } from '../utils/logger';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  matchedPostings: Array<{
    id: string;
    title: string;
    company: string;
    postedDate: Date;
    similarity: number;
  }>;
}

export class DuplicateDetectionService {
  private recentPostings: JobPosting[] = [];
  private readonly SIMILARITY_THRESHOLD = 0.8;
  private readonly MAX_STORED_POSTINGS = 1000;

  async checkDuplicate(posting: JobPosting): Promise<DuplicateCheckResult> {
    try {
      const matches = this.recentPostings
        .map(existingPosting => ({
          posting: existingPosting,
          similarity: this.calculateSimilarity(posting, existingPosting)
        }))
        .filter(match => match.similarity >= this.SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

      // Store the new posting
      this.storePosting(posting);

      if (matches.length === 0) {
        return {
          isDuplicate: false,
          similarity: 0,
          matchedPostings: []
        };
      }

      return {
        isDuplicate: true,
        similarity: matches[0].similarity,
        matchedPostings: matches.map(match => ({
          id: match.posting.id || '',
          title: match.posting.title,
          company: match.posting.company.name,
          postedDate: match.posting.postedDate,
          similarity: match.similarity
        }))
      };
    } catch (error) {
      logger.error('Error checking for duplicates:', error);
      throw error;
    }
  }

  private calculateSimilarity(posting1: JobPosting, posting2: JobPosting): number {
    const weights = {
      title: 0.3,
      description: 0.3,
      company: 0.2,
      requirements: 0.2
    };

    const titleSimilarity = this.calculateTextSimilarity(posting1.title, posting2.title);
    const descriptionSimilarity = this.calculateTextSimilarity(posting1.description, posting2.description);
    const companySimilarity = posting1.company.name === posting2.company.name ? 1 : 0;
    const requirementsSimilarity = this.calculateArraySimilarity(
      posting1.requirements,
      posting2.requirements
    );

    return (
      titleSimilarity * weights.title +
      descriptionSimilarity * weights.description +
      companySimilarity * weights.company +
      requirementsSimilarity * weights.requirements
    );
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '');
    const words1 = new Set(normalize(text1).split(/\s+/));
    const words2 = new Set(normalize(text2).split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1.map(item => item.toLowerCase()));
    const set2 = new Set(arr2.map(item => item.toLowerCase()));

    const intersection = new Set([...set1].filter(item => set2.has(item)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private storePosting(posting: JobPosting): void {
    this.recentPostings.push(posting);
    if (this.recentPostings.length > this.MAX_STORED_POSTINGS) {
      this.recentPostings.shift(); // Remove oldest posting
    }
  }
} 