'use client'

import { ChevronRight, ChevronLeft, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  activeTab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans'
  onTabChange: (tab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans') => void
  children?: React.ReactNode
  isCollapsed: boolean
  onToggleCollapse: (collapsed: boolean) => void
}

export function Sidebar({ activeTab, onTabChange, children, isCollapsed, onToggleCollapse }: SidebarProps) {
  const t = useTranslations('sidebar')

  const tabs = [
    { id: 'floorplan' as const, label: t('editFloorplan') },
    { id: 'design' as const, label: t('design') },
    { id: 'items' as const, label: t('addItems') },
    { id: 'my-floorplans' as const, label: t('myFloorplans') },
    { id: 'settings' as const, label: t('settings') },
  ]

  return (
    <>
      {/* Floating Toggle Button (shown when collapsed) */}
      <button
        onClick={() => onToggleCollapse(false)}
        className={cn(
          'fixed top-20 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300',
          isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        )}
        aria-label={t('openSidebar')}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar Container */}
      <div className="relative flex-shrink-0">
        {/* Sidebar */}
        <div
          className={cn(
            'border-r border-gray-200 bg-white overflow-x-hidden overflow-y-auto h-screen transition-all duration-300 ease-in-out relative',
            isCollapsed ? 'w-0' : 'w-80 p-5'
          )}
        >
          {/* Main Navigation */}
          <ul className={cn('space-y-0 -mx-5 mb-5 transition-opacity duration-300', isCollapsed ? 'opacity-0' : 'opacity-100')}>
            {tabs.map((tab) => (
              <li
                key={tab.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
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
          <hr className={cn('my-5 border-gray-200 transition-opacity duration-300', isCollapsed ? 'opacity-0' : 'opacity-100')} />

          {/* Context Menu Content */}
          <div className={cn('transition-opacity duration-300', isCollapsed ? 'opacity-0' : 'opacity-100')}>
            {children}
          </div>
        </div>

        {/* Collapse Button (positioned on the right edge of sidebar) */}
        <button
          onClick={() => onToggleCollapse(true)}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -right-4 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-full shadow-md p-2 transition-all duration-300 z-20',
            isCollapsed ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </>
  )
}
