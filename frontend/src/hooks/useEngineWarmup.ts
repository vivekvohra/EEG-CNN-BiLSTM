import { useEffect, useState } from "react";
import { healthCheck } from "../api/eegApi";

export type StatusTone = "muted" | "success" | "error" | "accent";

export type StatusState = {
  iconClass?: string;
  text: string;
  tone: StatusTone;
};

export function useEngineWarmup() {
  const [status, setStatus] = useState<StatusState>({
    iconClass: "fas fa-circle-notch fa-spin",
    text: "Booting AI Engine (May take ~10s)...",
    tone: "muted",
  });

  useEffect(() => {
    const run = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 20000);

        await healthCheck(controller.signal);

        window.clearTimeout(timeoutId);
        setStatus({
          iconClass: "fas fa-power-off",
          text: "Engine Ready",
          tone: "success",
        });
      } catch {
        setStatus({
          iconClass: "fas fa-power-off",
          text: "Engine Warming Up...",
          tone: "accent",
        });
      }
    };

    run();
  }, []);

  return { status, setStatus };
}