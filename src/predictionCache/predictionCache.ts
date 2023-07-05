import { InlineCompletionItem } from "vscode";
import { Result } from "../predictionUtils/callApi";
import { CachePrompt } from "../predictionUtils/inlineCompletion";

export let globalCache = new Map<string,string>();



