import { PipelineBoard } from '@/components/features/leads/pipeline-board';

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag a card to change its status.</p>
      </div>
      <PipelineBoard />
    </div>
  );
}
