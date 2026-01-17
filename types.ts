
export type ThemeColor = 'red' | 'cyan' | 'emerald' | 'purple' | 'gold';
export type LayoutType = 'modern' | 'minimal' | 'bold';
export type ContentType = 'image' | 'video';

export interface NewsPostData {
  headline: string;
  description: string;
  badge: string;
  username: string;
  date: string;
  themeColor: ThemeColor;
  layoutType: LayoutType;
  contentType: ContentType;
  imageUrl: string;
  videoUrl?: string;
  logoUrl?: string;
  logoText: string;
}

export interface InstagramPost {
  username: string;
  isVerified: boolean;
  location?: string;
  imageUrl: string;
  likes: number;
  caption: string;
}

export interface AIAnalysis {
  sentiment: string;
  engagementScore: number;
  hashtags: string[];
  suggestions: string[];
  summary: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
