import { Background } from '@/components/hud/Background';
import { Scanlines } from '@/components/hud/Scanlines';
import { Dashboard } from '@/pages/Dashboard';

export default function App() {
  return (
    <>
      <Background />
      <Dashboard />
      <Scanlines />
    </>
  );
}
