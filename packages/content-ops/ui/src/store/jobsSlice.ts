import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { JobItem, GetJobsResponse } from "@moto125/content-ops-shared";
import { API } from "../api";

export const fetchJobs = createAsyncThunk("jobs/fetch", async () => {
  const res = await API.getJobs();
  return res as GetJobsResponse;
});

export const runJob = createAsyncThunk(
  "jobs/run",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.runJob(id);
      if (!res.ok) throw new Error(res.error || "Run failed");
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? String(e));
    }
  }
);

export const deleteJob = createAsyncThunk(
  "jobs/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.deleteJob(id);
      if (!res.ok) throw new Error(res.error || "Delete failed");
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? String(e));
    }
  }
);

export const createSyncMediaJob = createAsyncThunk(
  "jobs/createSyncMedia",
  async (
    payload: {
      id?: string;
      cron?: string;      // opcional => manual-only
      concurrency: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.createSyncMediaJob(payload);
      if (!res.ok) throw new Error(res.error || "Create failed");
      return res.id!;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? String(e));
    }
  }
);

type JobsState = {
  items: JobItem[];
  loading: boolean;
  error?: string | null;

  runningId?: string | null;
  deletingId?: string | null;
  creating: boolean;
  createError?: string | null;
};

const initialState: JobsState = {
  items: [],
  loading: false,
  error: null,
  runningId: null,
  deletingId: null,
  creating: false,
  createError: null,
};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
      state.createError = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchJobs.pending, (s) => {
      s.loading = true; s.error = null;
    });
    b.addCase(fetchJobs.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.data ?? [];
    });
    b.addCase(fetchJobs.rejected, (s, a) => {
      s.loading = false; s.error = String(a.payload || a.error.message || "Failed to fetch jobs");
    });

    b.addCase(runJob.pending, (s, a) => {
      s.runningId = a.meta.arg; s.error = null;
    });
    b.addCase(runJob.fulfilled, (s) => {
      s.runningId = null;
    });
    b.addCase(runJob.rejected, (s, a) => {
      s.runningId = null;
      s.error = String(a.payload || a.error.message || "Failed to run job");
    });

    b.addCase(deleteJob.pending, (s, a) => {
      s.deletingId = a.meta.arg; s.error = null;
    });
    b.addCase(deleteJob.fulfilled, (s, a: PayloadAction<string>) => {
      s.deletingId = null;
      s.items = s.items.filter((j) => j.id !== a.payload);
    });
    b.addCase(deleteJob.rejected, (s, a) => {
      s.deletingId = null;
      s.error = String(a.payload || a.error.message || "Failed to delete job");
    });

    b.addCase(createSyncMediaJob.pending, (s) => {
      s.creating = true; s.createError = null;
    });
    b.addCase(createSyncMediaJob.fulfilled, (s) => {
      s.creating = false;
    });
    b.addCase(createSyncMediaJob.rejected, (s, a) => {
      s.creating = false;
      s.createError = String(a.payload || a.error.message || "Failed to create job");
    });
  },
});

export const { clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
