"use client";
import { useReducer } from "react";
import type { Gradient, Palette } from "@/types";

export interface DesignState { palette: Palette; gradient: Gradient }
export const INITIAL_DESIGN: DesignState = {
  palette: { mode: "Analogous", colors: ["#A78BFA", "#7C3AED", "#4F46E5", "#38BDF8", "#99F6E4"].map((hex, i) => ({ id: `initial-${i}`, hex, locked: false })) },
  gradient: { type: "linear", angle: 135, shape: "circle", position: "center", stops: ["#7C3AED", "#4F46E5", "#38BDF8"].map((color, i) => ({ id: `stop-${i}`, color, position: i * 50 })) },
};
interface State { current: DesignState; past: DesignState[]; future: DesignState[] }
type Action = { type: "palette"; value: Palette } | { type: "gradient"; value: Gradient } | { type: "restore"; value: DesignState } | { type: "undo" | "redo" };
function reducer(state: State, action: Action): State {
  if (action.type === "restore") return { current: action.value, past: [], future: [] };
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    return previous ? { current: previous, past: state.past.slice(0, -1), future: [state.current, ...state.future].slice(0, 40) } : state;
  }
  if (action.type === "redo") {
    const next = state.future[0];
    return next ? { current: next, past: [...state.past, state.current].slice(-40), future: state.future.slice(1) } : state;
  }
  if (action.type === "palette" || action.type === "gradient") {
    const current = { ...state.current, [action.type]: action.value };
    if (JSON.stringify(current) === JSON.stringify(state.current)) return state;
    return { current, past: [...state.past, state.current].slice(-40), future: [] };
  }
  return state;
}
export function useWorkspace() {
  const [state, dispatch] = useReducer(reducer, { current: INITIAL_DESIGN, past: [], future: [] });
  return { ...state, dispatch };
}
