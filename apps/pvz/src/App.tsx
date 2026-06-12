import { tokens } from '@cargo/tokens';

// The import of @cargo/tokens above is the proof that cross-package wiring works
// on the PWA (Vite + vite-plugin-pwa) platform. Nothing here is product UI.
export default function App() {
  return (
    <main>
      <h1>CARGO PVZ</h1>
      <p>Design tokens loaded: {Object.keys(tokens).length} keys</p>
    </main>
  );
}
