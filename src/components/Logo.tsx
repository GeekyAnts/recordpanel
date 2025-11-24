export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-950 flex items-center justify-center border border-gray-700 dark:border-gray-800">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
        </div>
      </div>
      <span className="text-xl font-bold text-foreground">
        RecordPanel
      </span>
    </div>
  )
}
