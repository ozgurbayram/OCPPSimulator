import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';
import { type ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { PageBreadcrumb } from './PageBreadcrumb';
import { Button } from './ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
}

export function DashboardLayout({
  children,
  breadcrumbItems,
}: DashboardLayoutProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className='flex flex-1 flex-col overflow-hidden'>
        <header
          className={`flex shrink-0 items-center gap-2 border-b ${
            isMobile ? 'h-14 px-3' : 'h-16 px-4'
          }`}
        >
          <SidebarTrigger className='-ml-1' />
          <PageBreadcrumb items={breadcrumbItems} />
          <div className='ml-auto'>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleDarkMode}
              className={isMobile ? 'h-7 w-7' : 'h-8 w-8'}
            >
              {isDarkMode ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )}
            </Button>
          </div>
        </header>
        <div
          className={`flex flex-1 flex-col gap-4 pt-0 ${
            isMobile ? 'p-3' : 'p-4'
          }`}
        >
          <div className='min-h-[100vh] flex-1 rounded-xl md:min-h-min'>
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
