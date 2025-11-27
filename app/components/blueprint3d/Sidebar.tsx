'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '../../providers/I18nProvider'
import { Button } from '@/components/ui/button'

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

  const mainTabs = [
    { id: 'floorplan' as const, label: t('editFloorplan') },
    { id: 'design' as const, label: t('design') },
    { id: 'items' as const, label: t('addItems') },
    { id: 'my-floorplans' as const, label: t('myFloorplans') }
  ]

  const settingsTab = { id: 'settings' as const, label: t('settings') }

  return (
    <div className="flex">
      {/* Sidebar Container */}
      <div className="relative flex-1">
        {/* Sidebar */}
        <div
          className={cn(
            'border-r border-border bg-gradient-to-b from-primary-50 via-background to-background overflow-x-hidden overflow-y-auto h-full transition-all duration-300 ease-in-out relative',
            isCollapsed ? 'w-0' : 'w-70 p-5'
          )}
        >
          {/* Main Navigation */}
          <ul
            className={cn(
              'space-y-0 -mx-5 mb-5 transition-opacity duration-300',
              isCollapsed ? 'opacity-0' : 'opacity-100'
            )}
          >
            {mainTabs.map((tab) => (
              <li
                key={tab.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                <button
                  onClick={() => onTabChange(tab.id)}
                  className="w-full text-left px-5 py-3 flex items-center justify-between"
                >
                  {tab.label}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <hr
            className={cn(
              'my-5 border-border transition-opacity duration-300',
              isCollapsed ? 'opacity-0' : 'opacity-100'
            )}
          />

          {/* Settings Tab (below divider) */}
          <ul
            className={cn(
              'space-y-0 -mx-5 mb-5 transition-opacity duration-300',
              isCollapsed ? 'opacity-0' : 'opacity-100'
            )}
          >
            <li
              className={cn(
                'cursor-pointer transition-colors',
                activeTab === settingsTab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <button
                onClick={() => onTabChange(settingsTab.id)}
                className="w-full text-left px-5 py-3 flex items-center justify-between"
              >
                {settingsTab.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
          </ul>

          {/* Context Menu Content */}
          <div
            className={cn(
              'transition-opacity duration-300',
              isCollapsed ? 'opacity-0' : 'opacity-100'
            )}
          >
            {children}
          </div>
        </div>

        {/* Collapse Button (positioned on the right edge of sidebar) */}
        <Button
          onClick={() => onToggleCollapse(true)}
          variant="outline"
          size="icon"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -right-4 rounded-full shadow-md transition-all duration-300 z-20',
            isCollapsed ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
