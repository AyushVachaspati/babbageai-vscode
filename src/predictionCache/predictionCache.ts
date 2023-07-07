import { InlineCompletionItem } from "vscode";
import { Result } from "../predictionUtils/callApi";
import { CachePrompt } from "../predictionUtils/inlineCompletion";
import { LRUCache } from "./lruCache";

// export let globalCache = new Map<string,string>();
export let globalCache = new LRUCache(1000);