import type {
  DataMirror,
  DataMirrorInitOptions,
} from "@moto125/data-mirror-core";
import { DataMirrorImpl } from "./DataMirrorImpl";

export function createDataMirror(): DataMirror {
  return new DataMirrorImpl();
}

export async function createAndStartDataMirror(
  opts: DataMirrorInitOptions
): Promise<DataMirror> {
  const dm = createDataMirror();
  await dm.init(opts);
  return dm;
}
