import { tokens } from '@cargo/tokens';

// The import of @cargo/tokens above is the proof that cross-package wiring works
// on the web (Vite) platform. Nothing here is product UI — just a skeleton screen.
export default function App() {
  return (
    <main>
      <h1>CARGO Web Ops</h1>
      <p>Design tokens loaded: {Object.keys(tokens).length} keys</p>
    </main>
  );
}
