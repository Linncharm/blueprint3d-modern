'use client'

import { ChevronRight, ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '../../providers/I18nProvider'
import { Button } from '@/components/ui/button'
import { useIsMobileOrTablet } from '@/hooks/use-media-query'
import { useEffect } from 'react'

interface SidebarProps {
  activeTab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans'
  onTabChange: (tab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans') => void
  children?: React.ReactNode
  isCollapsed: boolean
  onToggleCollapse: (collapsed: boolean) => void
}

export function Sidebar({
  activeTab,
  onTabChange,
  children,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const i18n = useI18n()
  const t = i18n.createT('sidebar')
  const isMobileOrTablet = useIsMobileOrTablet()

  const mainTabs = [
    { id: 'floorplan' as const, label: t('editFloorplan') },
    { id: 'design' as const, label: t('design') },
    { id: 'items' as const, label: t('addItems') },
    { id: 'my-floorplans' as const, label: t('myFloorplans') }
  ]

  const settingsTab = { id: 'settings' as const, label: t('settings') }

  // Auto-collapse on mobile/tablet when mounted
  useEffect(() => {
    if (isMobileOrTablet && !isCollapsed) {
      onToggleCollapse(true)
    }
  }, [isMobileOrTablet])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileOrTablet && !isCollapsed) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobileOrTablet, isCollapsed])

  return (
    <div className="flex">
      {/* Mobile/Tablet: Backdrop overlay */}
      {isMobileOrTablet && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => onToggleCollapse(true)}
        />
      )}

      {/* Sidebar Container */}
      <div className="relative flex-1">
        {/* Sidebar */}
        <div
          className={cn(
            'border-r border-border bg-gradient-to-b from-primary-50 via-background to-background overflow-x-hidden overflow-y-auto h-full transition-all duration-300 ease-in-out relative',
            // Mobile/Tablet: Full screen drawer from left
            isMobileOrTablet && [
              'fixed top-0 left-0 bottom-0 z-50',
              isCollapsed ? '-translate-x-full' : 'translate-x-0 w-[85vw] max-w-sm p-5'
            ],
            // Desktop: Regular sidebar
            !isMobileOrTablet && [isCollapsed ? 'w-0' : 'w-70 p-5']
          )}
        >
          {/* Mobile/Tablet: Close button */}
          {isMobileOrTablet && !isCollapsed && (
            <div className="flex justify-end mb-4 -mt-1 -mr-1">
              <Button
                onClick={() => onToggleCollapse(true)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Main Navigation */}
          <ul
            className={cn(
              'space-y-0 -mx-5 mb-5 transition-opacity duration-300',
              isCollapsed && !isMobileOrTablet ? 'opacity-0' : 'opacity-100'
            )}
          >
            {mainTabs.map((tab) => (
              <li key={tab.id} className="px-3 py-1">
                <button
                  onClick={() => {
                    onTabChange(tab.id)
                    if (isMobileOrTablet && tab.id === 'design') {
                      onToggleCollapse(true)
                    }
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 flex items-center justify-between',
                    'rounded-lg transition-all duration-200',
                    'text-sm font-medium',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <ChevronLeft
                    className={cn(
                      'h-4 w-4 transition-transform',
                      activeTab === tab.id ? 'opacity-100' : 'opacity-40'
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
          <hr
            className={cn(
              'my-5 border-border transition-opacity duration-300',
              isCollapsed && !isMobileOrTablet ? 'opacity-0' : 'opacity-100'
            )}
          />

          {/* Settings Tab (below divider) */}
          <ul
            className={cn(
              'space-y-0 -mx-5 mb-5 transition-opacity duration-300',
              isCollapsed && !isMobileOrTablet ? 'opacity-0' : 'opacity-100'
            )}
          >
            <li className="px-3 py-1">
              <button
                onClick={() => onTabChange(settingsTab.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 flex items-center justify-between',
                  'rounded-lg transition-all duration-200',
                  'text-sm font-medium',
                  activeTab === settingsTab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span>{settingsTab.label}</span>
                <ChevronLeft
                  className={cn(
                    'h-4 w-4 transition-transform',
                    activeTab === settingsTab.id ? 'opacity-100' : 'opacity-40'
                  )}
                />
              </button>
            </li>
          </ul>

          {/* Context Menu Content */}
          <div
            className={cn(
              'transition-opacity duration-300',
              isCollapsed && !isMobileOrTablet ? 'opacity-0' : 'opacity-100'
            )}
          >
            {children}
          </div>
        </div>

        {/* Desktop: Collapse Button (positioned on the right edge of sidebar) */}
        {!isMobileOrTablet && (
          <Button
            onClick={() => onToggleCollapse(true)}
            variant="outline"
            size="icon"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -left-4 rounded-full shadow-md transition-all duration-300 z-20',
              isCollapsed ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
