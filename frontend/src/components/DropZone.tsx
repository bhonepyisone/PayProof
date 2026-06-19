export default function DropZone() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-colors hover:border-blue-400">
      <p className="text-gray-500">Drop a KBZ Pay screenshot here</p>
      <p className="mt-1 text-sm text-gray-400">PNG, JPG, or WebP</p>
    </div>
  )
}
