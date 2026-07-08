"use client";

export function PreviewSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="wa-shimmer h-12 w-full rounded-xl" />
      <div className="wa-shimmer h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        <div className="wa-shimmer h-32 rounded-xl" />
        <div className="wa-shimmer h-32 rounded-xl" />
        <div className="wa-shimmer h-32 rounded-xl" />
      </div>
      <div className="wa-shimmer h-24 w-2/3 mx-auto rounded-xl" />
    </div>
  );
}

export function CodeSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="wa-shimmer h-4 rounded"
          style={{ width: `${40 + Math.random() * 50}%`, animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end">
        <div className="wa-shimmer h-16 w-3/5 rounded-2xl rounded-br-sm" />
      </div>
      <div className="flex justify-start">
        <div className="wa-shimmer h-24 w-4/5 rounded-2xl rounded-bl-sm" />
      </div>
      <div className="flex justify-end">
        <div className="wa-shimmer h-12 w-2/5 rounded-2xl rounded-br-sm" />
      </div>
    </div>
  );
}
