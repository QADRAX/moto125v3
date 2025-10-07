import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LogsEvent } from "@moto125/content-ops-shared";
import { API } from "../api";

type LogsState = {
  connected: boolean;
  lastError?: string | null;
  lines: string[];
  maxLines: number;
  _internal: {
    es?: EventSource;
  };
};

const initialState: LogsState = {
  connected: false,
  lastError: null,
  lines: [],
  maxLines: 1000,
  _internal: {},
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    addLine(state, action: PayloadAction<string>) {
      state.lines.push(action.payload);
      if (state.lines.length > state.maxLines) {
        state.lines.splice(0, state.lines.length - state.maxLines);
      }
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (action.payload) state.lastError = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.lastError = action.payload;
    },
    clear(state) {
      state.lines = [];
      state.lastError = null;
    },
    _setES(state, action: PayloadAction<EventSource | undefined>) {
      state._internal.es = action.payload;
    },
  },
});

export const { addLine, setConnected, setError, clear, _setES } =
  logsSlice.actions;

export const startLogs = () => (dispatch: any, getState: any) => {
  const es: EventSource | undefined = getState().logs._internal.es;
  if (es) return;

  const source = new EventSource(API.LOGS_STREAM);
  dispatch(_setES(source));

  source.addEventListener("message", (ev) => {
    try {
      const e = JSON.parse(ev.data) as LogsEvent;
      const lvl = String(e.level || "info").toUpperCase();
      const color =
        lvl === "ERROR"
          ? "text-red-600"
          : lvl === "WARN"
            ? "text-yellow-700"
            : lvl === "DEBUG"
              ? "text-gray-500"
              : lvl === "TRACE"
                ? "text-gray-400"
                : "text-blue-700";
      const line = `${e.ts ?? new Date().toISOString()} [${lvl}] ${e.msg || ""} ${e.ctx ? JSON.stringify(e.ctx) : ""}|||${color}`;
      dispatch(addLine(line));
      dispatch(setConnected(true));
    } catch (err: any) {
      dispatch(setError(err?.message ?? "Malformed log event"));
    }
  });

  source.addEventListener("error", () => {
    dispatch(setConnected(false));
    dispatch(setError("Log stream disconnected"));
  });
};

export const stopLogs = () => (dispatch: any, getState: any) => {
  const es: EventSource | undefined = getState().logs._internal.es;
  if (es) {
    es.close();
    dispatch(_setES(undefined));
    dispatch(setConnected(false));
  }
};

export default logsSlice.reducer;
