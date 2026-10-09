"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function LocalTime({ value }: { value: string }) {
  const onClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const date = new Date(value);
  // Keep the first client render equal to the server, then use the visitor's locale.
  return <time dateTime={value}>{onClient ? date.toLocaleString() : `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`}</time>;
}
