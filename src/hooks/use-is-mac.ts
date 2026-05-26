import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getIsMac = () => navigator.userAgent.includes("Mac");
const getIsMacServer = () => false;

export function useIsMac() {
  return useSyncExternalStore(subscribe, getIsMac, getIsMacServer);
}
