export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">✅ Test Page</h1>
        <p className="text-xl text-gray-600 mb-8">
          Si puedes ver esta página, las rutas están funcionando correctamente.
        </p>
        <div className="space-y-4">
          <a 
            href="/" 
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir a la página principal
          </a>
          <a 
            href="/dashboard" 
            className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ir al Dashboard
          </a>
          <a 
            href="/playground" 
            className="block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Ir al Playground
          </a>
        </div>
      </div>
    </div>
  );
}
