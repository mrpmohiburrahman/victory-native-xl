import * as React from "react";
import type { PointsArray, Scale } from "victory-native";
import { Path, PathProps, Skia } from "@shopify/react-native-skia";
import type { PathAnimationConfig } from "../../hooks/useAnimatedPath";
import { AnimatedPath } from "./AnimatedPath";

type CartesianBarsProps = {
  points: PointsArray;
  innerPadding?: number;
  xScale: Scale;
  yScale: Scale;
  animate?: PathAnimationConfig;
} & Partial<Pick<PathProps, "color">>;

export function CartesianBars({
  points,
  innerPadding = 0.2,
  xScale,
  yScale,
  animate,
  ...ops
}: React.PropsWithChildren<CartesianBarsProps>) {
  const barWidth = React.useMemo(() => {
    const domainWidth = xScale.range().at(1)! - xScale.range().at(0)!;
    return ((1 - innerPadding) * domainWidth) / (points.length - 1);
  }, [points.length, innerPadding, xScale]);

  const path = React.useMemo(() => {
    const p = Skia.Path.Make();

    points.forEach(({ x, y }) => {
      p.addRect(
        Skia.XYWHRect(x - barWidth / 2, y, barWidth, yScale.range().at(1)! - y),
      );
    });

    return p;
  }, [points, barWidth, yScale]);

  return React.createElement(animate ? AnimatedPath : Path, {
    path,
    style: "fill",
    ...(Boolean(animate) && { animate }),
    ...ops,
  });
}
