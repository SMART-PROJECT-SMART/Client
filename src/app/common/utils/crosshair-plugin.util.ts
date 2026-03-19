import type { Chart, Plugin } from 'chart.js';
import type { WritableSignal } from '@angular/core';
import { ClientConstants } from '../constants/clientConstants.constant';

const { CROSSHAIR_COLOR, CROSSHAIR_WIDTH, CROSSHAIR_PLUGIN_ID } = ClientConstants.ChartConfig;

export function createCrosshairPlugin(crosshairIndex: WritableSignal<number | null>): Plugin<'line'> {
  return {
    id: CROSSHAIR_PLUGIN_ID,
    afterEvent: (chart: Chart, args: { event: { type: string; x: number | null } }) => {
      if (args.event.type === 'mousemove' && args.event.x !== null) {
        const xScale = chart.scales['x'];
        const rawIndex = xScale.getValueForPixel(args.event.x);
        crosshairIndex.set(rawIndex !== undefined ? Math.round(rawIndex as number) : null);
      }
      if (args.event.type === 'mouseout') {
        crosshairIndex.set(null);
      }
    },
    afterDraw: (chart: Chart) => {
      const index = crosshairIndex();
      if (index === null) return;

      const xScale = chart.scales['x'];
      const xPixel = xScale.getPixelForValue(index);
      const yScale = chart.scales['y'];

      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPixel, yScale.top);
      ctx.lineTo(xPixel, yScale.bottom);
      ctx.lineWidth = CROSSHAIR_WIDTH;
      ctx.strokeStyle = CROSSHAIR_COLOR;
      ctx.stroke();
      ctx.restore();
    },
  };
}
