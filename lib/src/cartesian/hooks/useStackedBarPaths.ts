import React from "react";
import {
  Skia,
  type Color,
  type PathProps,
  type SkPath,
} from "@shopify/react-native-skia";
import {
  createRoundedRectPath,
  type RoundedCorners,
} from "lib/src/utils/createRoundedRectPath";
import type { ChartBounds, InputFieldType, PointsArray } from "lib/src/types";
import { useCartesianChartContext } from "../contexts/CartesianChartContext";
import { useBarWidth } from "./useBarWidth";

type CustomizablePathProps = Partial<
  Pick<PathProps, "color" | "blendMode" | "opacity" | "antiAlias">
>;

const DEFAULT_COLORS = ["red", "orange", "blue", "green", "blue", "purple"];

export type StackedBarPath = {
  path: SkPath;
  key: string;
  color?: Color;
} & CustomizablePathProps & {
    children?: React.ReactNode;
  };

type Props = {
  points: PointsArray[];
  chartBounds: ChartBounds;
  innerPadding?: number;
  barWidth?: number;
  barCount?: number;
  colors?: Color[];
  barOptions?: ({
    columnIndex,
    rowIndex,
    isBottom,
    isTop,
  }: {
    isBottom: boolean;
    isTop: boolean;
    columnIndex: number;
    rowIndex: number;
  }) => CustomizablePathProps & { roundedCorners?: RoundedCorners };
};
export const useStackedBarPaths = ({
  points,
  chartBounds,
  innerPadding = 0.25,
  barWidth: customBarWidth,
  barCount,
  barOptions = () => ({}),
  colors = DEFAULT_COLORS,
}: Props) => {
  const { yScale } = useCartesianChartContext();
  const barWidth = useBarWidth({
    points,
    chartBounds,
    innerPadding,
    customBarWidth,
    barCount,
  });

  const barYPositionOffsetTracker = points.reduce(
    (acc, points) => {
      points.map((point) => {
        const xValue = point.xValue;
        if (acc[xValue]) {
          acc[xValue] += 0 as number;
        } else {
          acc[xValue] = 0 as number;
        }
      });

      return acc;
    },
    {} as Record<InputFieldType, number>,
  );

  const paths = React.useMemo(() => {
    const bars: StackedBarPath[] = [];

    points.forEach((pointsArray, i) => {
      const isTop = i === points.length - 1;
      const isBottom = i === 0;

      pointsArray.forEach((point, j) => {
        const options = barOptions({
          columnIndex: i,
          rowIndex: j,
          isBottom,
          isTop,
        });
        const { roundedCorners, color, ...ops } = options;
        const path = Skia.Path.Make();
        const { yValue, x, y } = point;
        if (typeof y !== "number") return;
        const barHeight = yScale(0) - y;
        const currentYHeightOffset =
          barYPositionOffsetTracker?.[point.xValue!] ?? 0;
        const offset = currentYHeightOffset > 0 ? currentYHeightOffset : 0;

        if (roundedCorners) {
          const nonUniformRoundedRect = createRoundedRectPath(
            x,
            y - offset,
            barWidth,
            barHeight,
            roundedCorners,
            Number(yValue),
          );
          path.addRRect(nonUniformRoundedRect);
        } else {
          path.addRect(
            Skia.XYWHRect(
              point.x - barWidth / 2,
              y - offset,
              barWidth,
              barHeight,
            ),
          );
        }

        barYPositionOffsetTracker[point.xValue!] =
          barHeight + currentYHeightOffset;

        const bar = {
          path,
          key: `${i}-${j}`,
          color: color ?? colors[i],
          ...ops,
        };
        bars.push(bar);
      });
    });

    return bars;
  }, [barOptions, barWidth, barYPositionOffsetTracker, colors, points, yScale]);

  return paths;
};