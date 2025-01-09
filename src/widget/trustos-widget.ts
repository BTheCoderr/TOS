import { JobPostingFlag } from '../types/jobPosting';

interface TrustOSConfig {
  apiKey: string;
  baseUrl?: string;
  theme?: 'light' | 'dark' | 'custom';
  customTheme?: {
    badgeColors?: {
      verified: {
        background: string;
        text: string;
        border?: string;
      };
      flagged: {
        background: string;
        text: string;
        border?: string;
      };
    };
    popupColors?: {
      background: string;
      text: string;
      border: string;
    };
  };
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  badgeStyle?: 'minimal' | 'standard' | 'detailed';
  autoHidePopup?: boolean;
  popupTimeout?: number;
  refreshInterval?: number;
  onVerificationUpdate?: (result: VerificationBadge) => void;
  onError?: (error: Error) => void;
  i18n?: {
    verifiedText?: string;
    flaggedText?: string;
    confidenceLabel?: string;
    verificationDateLabel?: string;
    flagsLabel?: string;
    recommendationsLabel?: string;
    closeText?: string;
  };
  customBadgeTemplate?: (badge: VerificationBadge) => string;
  customMetricsTemplate?: (metrics: any) => string;
}

interface VerificationBadge {
  isVerified: boolean;
  confidence: number;
  verificationDate: string;
  companyName: string;
  badgeUrl: string;
}

interface VerificationMetrics {
  flags: JobPostingFlag[];
  recommendations: string[];
}

class TrustOSWidget {
  private config: TrustOSConfig;
  private baseUrl: string;
  private badges: Map<string, VerificationBadge> = new Map();
  private popups: Map<string, HTMLElement> = new Map();
  private refreshIntervals: Map<string, number> = new Map();
  private popupTimeouts: Map<string, number> = new Map();

  constructor(config: TrustOSConfig) {
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
    this.baseUrl = config.baseUrl || 'https://api.trustos.com';
    this.initializeStyles();
  }

  private getDefaultConfig(): Partial<TrustOSConfig> {
    return {
      theme: 'light',
      badgePosition: 'inline',
      badgeStyle: 'standard',
      autoHidePopup: true,
      popupTimeout: 5000,
      refreshInterval: 60000,
      i18n: {
        verifiedText: 'Verified Company',
        flaggedText: 'Flagged Post',
        confidenceLabel: 'Confidence Score',
        verificationDateLabel: 'Verification Date',
        flagsLabel: 'Flags',
        recommendationsLabel: 'Recommendations',
        closeText: 'Close'
      }
    };
  }

  async initialize(jobId: string, elementId: string) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      const badge = await this.fetchBadge(jobId);
      if (badge) {
        this.badges.set(jobId, badge);
        this.renderBadge(jobId, element);
        this.setupAutoRefresh(jobId, element);
      }
    } catch (error) {
      console.error('Failed to initialize TrustOS widget:', error);
      this.config.onError?.(error as Error);
    }
  }

  private setupAutoRefresh(jobId: string, element: HTMLElement) {
    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      const intervalId = window.setInterval(async () => {
        try {
          const badge = await this.fetchBadge(jobId);
          if (badge) {
            this.badges.set(jobId, badge);
            this.updateBadge(jobId, element);
            this.config.onVerificationUpdate?.(badge);
          }
        } catch (error) {
          console.error('Failed to refresh badge:', error);
          this.config.onError?.(error as Error);
        }
      }, this.config.refreshInterval);

      this.refreshIntervals.set(jobId, intervalId);
    }
  }

  private updateBadge(jobId: string, element: HTMLElement) {
    const existingBadge = element.querySelector(`[data-job-id="${jobId}"]`);
    if (existingBadge) {
      existingBadge.remove();
    }
    this.renderBadge(jobId, element);
  }

  private renderBadge(jobId: string, container: HTMLElement) {
    const badge = this.badges.get(jobId);
    if (!badge) return;

    const badgeElement = document.createElement('div');
    badgeElement.className = `trustos-badge trustos-badge-${this.config.badgeStyle}`;
    badgeElement.setAttribute('data-job-id', jobId);

    if (this.config.customBadgeTemplate) {
      badgeElement.innerHTML = this.config.customBadgeTemplate(badge);
    } else {
      const badgeContent = document.createElement('div');
      badgeContent.className = `trustos-badge-content ${badge.isVerified ? 'verified' : 'flagged'}`;
      
      if (this.config.badgeStyle === 'detailed') {
        badgeContent.innerHTML = this.getDetailedBadgeContent(badge);
      } else {
        const badgeImage = document.createElement('img');
        badgeImage.src = badge.badgeUrl;
        badgeImage.alt = `${badge.isVerified ? this.config.i18n?.verifiedText : this.config.i18n?.flaggedText} by TrustOS`;
        
        const badgeText = document.createElement('span');
        badgeText.textContent = badge.isVerified ? 
          this.config.i18n?.verifiedText || 'Verified Company' : 
          this.config.i18n?.flaggedText || 'Flagged Post';

        badgeContent.appendChild(badgeImage);
        badgeContent.appendChild(badgeText);
      }

      badgeElement.appendChild(badgeContent);
    }

    badgeElement.addEventListener('click', () => this.showPopup(jobId, container));
    
    if (this.config.badgePosition !== 'inline') {
      badgeElement.style.position = 'absolute';
      switch (this.config.badgePosition) {
        case 'top-left':
          badgeElement.style.top = '8px';
          badgeElement.style.left = '8px';
          break;
        case 'top-right':
          badgeElement.style.top = '8px';
          badgeElement.style.right = '8px';
          break;
        case 'bottom-left':
          badgeElement.style.bottom = '8px';
          badgeElement.style.left = '8px';
          break;
        case 'bottom-right':
          badgeElement.style.bottom = '8px';
          badgeElement.style.right = '8px';
          break;
      }
      container.style.position = 'relative';
    }

    container.appendChild(badgeElement);
  }

  private getDetailedBadgeContent(badge: VerificationBadge): string {
    return `
      <div class="trustos-badge-header">
        <img src="${badge.badgeUrl}" alt="${badge.isVerified ? 'Verified' : 'Flagged'} by TrustOS">
        <span>${badge.isVerified ? this.config.i18n?.verifiedText : this.config.i18n?.flaggedText}</span>
      </div>
      <div class="trustos-badge-details">
        <div class="trustos-badge-metric">
          <label>${this.config.i18n?.confidenceLabel}</label>
          <span>${badge.confidence}%</span>
        </div>
      </div>
    `;
  }

  private async showPopup(jobId: string, container: HTMLElement) {
    const badge = this.badges.get(jobId);
    if (!badge) return;

    const metrics = await this.fetchMetrics(jobId);
    if (!metrics) return;

    // Close any existing popups
    this.closeAllPopups();

    const popup = document.createElement('div');
    popup.className = 'trustos-popup';
    
    if (this.config.customMetricsTemplate) {
      popup.innerHTML = this.config.customMetricsTemplate(metrics);
    } else {
      const header = document.createElement('div');
      header.className = 'trustos-popup-header';
      header.innerHTML = `
        <h3>${badge.companyName}</h3>
        <span class="trustos-close">${this.config.i18n?.closeText || '×'}</span>
      `;

      const content = document.createElement('div');
      content.className = 'trustos-popup-content';
      content.innerHTML = `
        <div class="trustos-metrics">
          <div class="trustos-metric">
            <label>${this.config.i18n?.confidenceLabel}</label>
            <span>${badge.confidence}%</span>
          </div>
          <div class="trustos-metric">
            <label>${this.config.i18n?.verificationDateLabel}</label>
            <span>${new Date(badge.verificationDate).toLocaleDateString()}</span>
          </div>
        </div>
        ${this.renderMetricsDetails(metrics)}
      `;

      popup.appendChild(header);
      popup.appendChild(content);
    }

    const closeButton = popup.querySelector('.trustos-close');
    closeButton?.addEventListener('click', () => this.closePopup(jobId));

    this.popups.set(jobId, popup);
    container.appendChild(popup);

    if (this.config.autoHidePopup && this.config.popupTimeout) {
      const timeoutId = window.setTimeout(() => {
        this.closePopup(jobId);
      }, this.config.popupTimeout);
      this.popupTimeouts.set(jobId, timeoutId);
    }
  }

  private closeAllPopups() {
    for (const [jobId] of this.popups) {
      this.closePopup(jobId);
    }
  }

  private closePopup(jobId: string) {
    const popup = this.popups.get(jobId);
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
      this.popups.delete(jobId);
    }

    const timeoutId = this.popupTimeouts.get(jobId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this.popupTimeouts.delete(jobId);
    }
  }

  destroy() {
    // Clean up all intervals and timeouts
    for (const [jobId, intervalId] of this.refreshIntervals) {
      window.clearInterval(intervalId);
      this.refreshIntervals.delete(jobId);
    }

    for (const [jobId, timeoutId] of this.popupTimeouts) {
      window.clearTimeout(timeoutId);
      this.popupTimeouts.delete(jobId);
    }

    // Close all popups
    this.closeAllPopups();
  }

  private async fetchBadge(jobId: string): Promise<VerificationBadge | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/badge/${jobId}`, {
        headers: {
          'x-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch badge: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching badge:', error);
      return null;
    }
  }

  private async fetchMetrics(jobId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics/${jobId}`, {
        headers: {
          'x-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  }

  private renderMetricsDetails(metrics: any) {
    return `
      <div class="trustos-details">
        ${metrics.flags.length > 0 ? `
          <div class="trustos-section">
            <h4>Flags</h4>
            <ul class="trustos-flags">
              ${metrics.flags.map((flag: JobPostingFlag) => `
                <li class="trustos-flag ${flag.severity.toLowerCase()}">
                  <strong>${flag.type}</strong>
                  <p>${flag.description}</p>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${metrics.recommendations.length > 0 ? `
          <div class="trustos-section">
            <h4>Recommendations</h4>
            <ul class="trustos-recommendations">
              ${metrics.recommendations.map((rec: string) => `
                <li>${rec}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  private initializeStyles() {
    const styles = document.createElement('style');
    styles.textContent = this.getStyles();
    document.head.appendChild(styles);
  }

  private getStyles(): string {
    const { theme, customTheme } = this.config;
    const isCustom = theme === 'custom' && customTheme;

    return `
      .trustos-badge {
        display: inline-block;
        cursor: pointer;
        margin: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .trustos-badge-minimal {
        margin: 4px;
      }

      .trustos-badge-detailed {
        min-width: 200px;
      }

      .trustos-badge-content {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 4px;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .trustos-badge-content.verified {
        background: ${isCustom ? customTheme.badgeColors?.verified.background : '#e8f5e9'};
        color: ${isCustom ? customTheme.badgeColors?.verified.text : '#2e7d32'};
        ${isCustom && customTheme.badgeColors?.verified.border ? 
          `border: 1px solid ${customTheme.badgeColors.verified.border};` : ''}
      }

      .trustos-badge-content.flagged {
        background: ${isCustom ? customTheme.badgeColors?.flagged.background : '#ffebee'};
        color: ${isCustom ? customTheme.badgeColors?.flagged.text : '#c62828'};
        ${isCustom && customTheme.badgeColors?.flagged.border ? 
          `border: 1px solid ${customTheme.badgeColors.flagged.border};` : ''}
      }

      .trustos-badge img {
        width: 20px;
        height: 20px;
      }

      .trustos-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        z-index: 10000;
      }

      .trustos-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #eee;
      }

      .trustos-close {
        cursor: pointer;
        font-size: 24px;
        color: #666;
      }

      .trustos-popup-content {
        padding: 16px;
      }

      .trustos-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .trustos-metric {
        text-align: center;
      }

      .trustos-metric label {
        display: block;
        color: #666;
        margin-bottom: 4px;
      }

      .trustos-metric span {
        font-size: 24px;
        font-weight: bold;
      }

      .trustos-section {
        margin-bottom: 24px;
      }

      .trustos-flags {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .trustos-flag {
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 4px;
      }

      .trustos-flag.high {
        background: #ffebee;
        border-left: 4px solid #c62828;
      }

      .trustos-flag.medium {
        background: #fff3e0;
        border-left: 4px solid #ef6c00;
      }

      .trustos-flag.low {
        background: #f1f8e9;
        border-left: 4px solid #558b2f;
      }

      .trustos-recommendations {
        list-style: none;
        padding: 0;
      }

      .trustos-recommendations li {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }

      .trustos-recommendations li:last-child {
        border-bottom: none;
      }

      ${this.config.theme === 'dark' ? `
        .trustos-popup {
          background: #1e1e1e;
          color: #fff;
        }

        .trustos-popup-header {
          border-bottom-color: #333;
        }

        .trustos-close {
          color: #999;
        }

        .trustos-metric label {
          color: #999;
        }

        .trustos-recommendations li {
          border-bottom-color: #333;
        }
      ` : ''}
    `;
  }
}

// Declare global type for the widget
declare global {
  interface Window {
    TrustOS: any; // Keep it as 'any' to avoid conflicts with existing declarations
  }
}

export {}; 