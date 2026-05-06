import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <>
      <AppRouter />
      {/* Add Toaster here. The toastOptions style it to match your UI */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1f2937', // gray-800
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.75rem', // rounded-xl
            border: '1px solid #f3f4f6', // border-gray-100
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
}

export default App;