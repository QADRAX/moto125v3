import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import jobsReducer from "./jobsSlice";
import logsReducer from "./logSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    logs: logsReducer,
  },
  // Permitimos EventSource en thunks (obj no serializable) sin warnings
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [
          "logs/startStream/fulfilled",
          "logs/startStream/pending",
          "logs/startStream/rejected",
        ],
        ignoredPaths: ["logs._internal"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Hooks tipados */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
