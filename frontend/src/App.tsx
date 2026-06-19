import DropZone from './components/DropZone'
import ResultCard from './components/ResultCard'

function App() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            PayProof
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Drop a KBZ Pay screenshot to extract payment details — entirely
            on-device.
          </p>
        </div>

        <DropZone />
        <ResultCard />
      </div>
    </main>
  )
}

export default App
