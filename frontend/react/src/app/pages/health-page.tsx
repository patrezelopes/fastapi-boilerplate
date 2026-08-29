import { useHealth } from "@/features/health/use-health";
import { Badge } from "@/ui/badge";
import { Loading } from "@/ui/states";

export function HealthPage() {
  const health = useHealth();

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Situação do sistema</h1>

      {health.isPending ? (
        <Loading />
      ) : (
        <dl className="flex flex-col gap-3 rounded border border-stone-200 bg-white p-6 text-sm">
          <div className="flex items-center justify-between">
            <dt>Aplicação no ar</dt>
            <dd>
              <Badge ok={health.data?.alive ?? false}>
                {health.data?.alive ? "no ar" : "fora"}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Pronta para tráfego</dt>
            <dd>
              <Badge ok={health.data?.ready ?? false}>
                {health.data?.ready ? "pronta" : "indisponível"}
              </Badge>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
