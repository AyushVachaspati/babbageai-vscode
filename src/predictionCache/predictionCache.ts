import { LRUCache } from "./lruCache";

// export let globalCache = new Map<string,string>();
export let globalCache = new LRUCache(1000);