/**
 * Explanatory diagram library: inline-SVG, theme-aware (CSS variables only), server-component safe.
 * Every key of `diagramCatalog` has a component here; unknown names render a small fallback box.
 */
import type { FC } from "react";
import { diagramCatalog, type DiagramName } from "@/content/diagram-catalog";
import type { DiagramProps } from "./primitives";
import { FdmPrinter, LayersStack, SubtractiveVsAdditive, XyzAxes } from "./printing";
import { ExactDimension, MoveZ, NudgeKeys, RotateHandles, RulerTool, ScaleHandles, Selection, ViewControls, Workplane } from "./cad";
import { AlignHandles, DieNet, DuplicatePattern, GroupHole, MirrorAxis, SolidVsHole, TextRaisedRecessed } from "./modeling";
import { ConstraintColors, FeatureHistory, ProMoves, ShapesVsSketches, SketchExtrude, VariableRipple } from "./procad";
import { FaceVsEdge, FillSquare, FlatVsUp, IsoSketch, SameShapeTurned, TetrominoSet, PuzzleChamfer, PuzzleLayerMap, ToleranceStack } from "./puzzle";
import * as Steps from "./puzzle-steps";
import { CaliperParts, ClearanceFit, FitTypes, MeasureCritical, PrototypeCritical, ToleranceRange } from "./precision";
import {
  BridgeSpan,
  HookFlat,
  HookStanding,
  HookUpsideDown,
  InfillPatterns,
  MaterialCompare,
  OrientationStrength,
  OverhangAngles,
  SelfSupporting,
  Supports,
  WallThickness,
  WallsPerimeters,
} from "./dfam";
import {
  FailureElephantFoot,
  FailureLayerShift,
  FailureSpaghetti,
  FailureStringing,
  FailureUnderExtrusion,
  FailureWarping,
  FirstLayer,
  SupportScars,
} from "./failures";
import { ConstraintVsWish, DesignCycle, FollowToDesign, PhoneStandSymptoms, SketchConcepts } from "./design";

export type { DiagramProps } from "./primitives";

export const diagramComponents: Record<DiagramName, FC<DiagramProps>> = {
  "fdm-printer": FdmPrinter,
  "layers-stack": LayersStack,
  "subtractive-vs-additive": SubtractiveVsAdditive,
  "xyz-axes": XyzAxes,
  "view-controls": ViewControls,
  selection: Selection,
  workplane: Workplane,
  "nudge-keys": NudgeKeys,
  "move-z": MoveZ,
  "scale-handles": ScaleHandles,
  "exact-dimension": ExactDimension,
  "rotate-handles": RotateHandles,
  "group-hole": GroupHole,
  "solid-vs-hole": SolidVsHole,
  "align-handles": AlignHandles,
  "duplicate-pattern": DuplicatePattern,
  "mirror-axis": MirrorAxis,
  "text-raised-recessed": TextRaisedRecessed,
  "die-net": DieNet,
  "ruler-tool": RulerTool,
  "caliper-parts": CaliperParts,
  "measure-critical": MeasureCritical,
  "clearance-fit": ClearanceFit,
  "tolerance-range": ToleranceRange,
  "fit-types": FitTypes,
  "prototype-critical": PrototypeCritical,
  "wall-thickness": WallThickness,
  "overhang-angles": OverhangAngles,
  "bridge-span": BridgeSpan,
  supports: Supports,
  "self-supporting": SelfSupporting,
  "orientation-strength": OrientationStrength,
  "hook-standing": HookStanding,
  "hook-flat": HookFlat,
  "hook-upside-down": HookUpsideDown,
  "infill-patterns": InfillPatterns,
  "walls-perimeters": WallsPerimeters,
  "material-compare": MaterialCompare,
  "failure-stringing": FailureStringing,
  "failure-warping": FailureWarping,
  "failure-spaghetti": FailureSpaghetti,
  "failure-layer-shift": FailureLayerShift,
  "failure-elephant-foot": FailureElephantFoot,
  "failure-under-extrusion": FailureUnderExtrusion,
  "first-layer": FirstLayer,
  "support-scars": SupportScars,
  "phone-stand-symptoms": PhoneStandSymptoms,
  "design-cycle": DesignCycle,
  "follow-to-design": FollowToDesign,
  "constraint-vs-wish": ConstraintVsWish,
  "shapes-vs-sketches": ShapesVsSketches,
  "sketch-extrude": SketchExtrude,
  "constraint-colors": ConstraintColors,
  "feature-history": FeatureHistory,
  "variable-ripple": VariableRipple,
  "pro-moves": ProMoves,
  "puzzle-layer-map": PuzzleLayerMap,
  "face-vs-edge": FaceVsEdge,
  "tolerance-stack": ToleranceStack,
  "puzzle-chamfer": PuzzleChamfer,
  "iso-sketch": IsoSketch,
  "same-shape-turned": SameShapeTurned,
  "tetromino-set": TetrominoSet,
  "fill-square": FillSquare,
  "flat-vs-up": FlatVsUp,
  "sketch-concepts": SketchConcepts,
  "iso-paper": Steps.IsoPaper,
  "iso-cube-1": Steps.IsoCube1,
  "iso-cube-2": Steps.IsoCube2,
  "iso-cube-3": Steps.IsoCube3,
  "iso-cube-4": Steps.IsoCube4,
  "iso-beside-1": Steps.IsoBeside1,
  "iso-beside-2": Steps.IsoBeside2,
  "iso-beside-3": Steps.IsoBeside3,
  "iso-beside-4": Steps.IsoBeside4,
  "iso-up-1": Steps.IsoUp1,
  "iso-up-2": Steps.IsoUp2,
  "iso-up-3": Steps.IsoUp3,
  "piece-view-iso": Steps.PieceIso,
  "piece-view-top": Steps.PieceTop,
  "piece-view-front": Steps.PieceFront,
  "iso-hidden-cube": Steps.HiddenCube,
  "piece-bank": Steps.PieceBank,
  "puzzle-sample-whole": Steps.SampleWhole,
  "puzzle-sample-sliced": Steps.SampleSliced,
  "layer-step-bottom": Steps.LayerBottom,
  "layer-step-middle": Steps.LayerMiddle,
  "layer-step-top": Steps.LayerTop,
  "puzzle-count": Steps.PuzzleCount,
  "puzzle-build-1": Steps.PuzzleBuild[0],
  "puzzle-build-2": Steps.PuzzleBuild[1],
  "puzzle-build-3": Steps.PuzzleBuild[2],
  "puzzle-build-4": Steps.PuzzleBuild[3],
  "puzzle-build-5": Steps.PuzzleBuild[4],
  "puzzle-build-6": Steps.PuzzleBuild[5],
};

export function isDiagramName(name: string): name is DiagramName {
  return Object.prototype.hasOwnProperty.call(diagramCatalog, name);
}

/**
 * Render a catalog diagram as `<svg role="img" aria-labelledby=…>` with a `<title>`
 * (defaults to the catalog description). Unknown names render a small fallback box; never throws.
 */
export function Diagram({ name, className, title }: { name: string; className?: string; title?: string }) {
  const Component = isDiagramName(name) ? diagramComponents[name] : undefined;
  if (!Component) {
    return (
      <div
        role="note"
        className={className}
        data-diagram-missing={name}
        style={{
          border: "1px dashed var(--border)",
          borderRadius: 8,
          padding: "0.75rem 1rem",
          color: "var(--muted)",
          background: "var(--surface-2)",
          fontSize: "0.875rem",
          textAlign: "center",
        }}
      >
        Diagram unavailable
      </div>
    );
  }
  return <Component className={className} title={title} />;
}

export default Diagram;
