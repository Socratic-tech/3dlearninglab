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
  "sketch-concepts": SketchConcepts,
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
