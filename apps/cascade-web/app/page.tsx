import { Button, TierBadge } from '@tierfall/cascade-ui';

export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-cascade-6">
      <h1 className="text-display font-sans font-bold">Cascade</h1>
      <p className="text-body max-w-md text-center">
        Self-hosted visual AI workflow editor built on TierFall. Routing is on the canvas, not in a
        settings panel.
      </p>
      <div className="flex gap-cascade-3" aria-label="tier ramp preview">
        {[0, 1, 2, 3, 4].map((tier) => (
          <TierBadge key={tier} tier={tier as 0 | 1 | 2 | 3 | 4} />
        ))}
      </div>
      <Button>Get started</Button>
    </main>
  );
}
