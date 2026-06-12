import { Showcase } from './src/Showcase';

// The mobile entry now renders the RN component showcase — every component in
// apps/mobile/src/ui on the shared @cargo/tokens. (Token-only proof lives in the
// web-ops token showcase; this exercises the real components.)
export default function App() {
  return <Showcase />;
}
