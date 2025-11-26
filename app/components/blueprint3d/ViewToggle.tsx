'use client'

interface ViewToggleProps {
  viewMode: '2d' | '3d'
  onViewChange: (mode: '2d' | '3d') => void
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="absolute top-5 right-5 flex gap-1 bg-white border border-gray-300 rounded overflow-hidden">
      <button
        onClick={() => onViewChange('3d')}
        className={`px-3 py-1.5 text-sm transition-colors ${
          viewMode === '3d'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        3D
      </button>
      <button
        onClick={() => onViewChange('2d')}
        className={`px-3 py-1.5 text-sm transition-colors ${
          viewMode === '2d'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        2D
      </button>
    </div>
  )
}
