import { ReactNode, useEffect } from 'react';
import { Head } from 'Themes/components/Head';
import { Header } from 'Themes/components/Header';
import { Footer } from 'Themes/components/Footer';
import clsx from 'clsx';
import * as ChannelService from '@channel.io/channel-web-sdk-loader';
import { useTheme } from 'next-themes';
import { Blog } from '@/constants/blog';
import { Inter, Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';

const InterSans = Inter({ subsets: ['latin'], variable: '--Inter' });

const NotoSans = Noto_Sans_KR({ subsets: ['latin'], variable: '--Noto-Sans-KR' });

const JetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--JetBrains-Mono' });

interface BaseLayoutProps {
  className?: string;
  children: ReactNode;
}

export function BaseLayout({ children, className }: BaseLayoutProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const pluginKey = Blog.channelPluginKey;
    if (!pluginKey) {
      return;
    }

    ChannelService.loadScript();
    ChannelService.boot({ pluginKey });

    if (theme === 'dark') {
      ChannelService.setAppearance('dark');
    } else {
      ChannelService.setAppearance('light');
    }
  }, [theme]);

  return (
    <div className={clsx(InterSans.variable, JetBrainsMono.variable, NotoSans.variable, 'font-sans')}>
      <Head />
      <Header />
      <main className={clsx('max-w-3xl mx-auto px-8 pt-8', className)}>{children}</main>
      <Footer />
    </div>
  );
}
