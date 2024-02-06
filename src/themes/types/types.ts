import { Blog } from '@/constants/blog';
import type { PageOpts } from 'nextra';

type PageLayout = 'default' | 'posts' | 'post' | 'tags' | 'tag';

export type FrontMatter = {
  // 메타데이터
  title?: string;
  description?: string;
  image?: string;

  // 블로그 컨텐츠
  icon?: string;
  date?: string;
  draft?: boolean;

  // 태그, 시리즈
  tags?: string[];
  series?: string;

  // 페이지 레이아웃
  layout?: PageLayout;
};

export type BlogPageOpts = PageOpts<FrontMatter>;
export interface LayoutProps {
  config: typeof Blog;
  opts: BlogPageOpts;
}
