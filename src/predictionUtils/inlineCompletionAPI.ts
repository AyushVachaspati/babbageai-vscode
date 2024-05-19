import OpenAI from 'openai';
import {updateStatusBarArtemusActive, updateStatusBarFetchingPrediction } from '../statusBar/statusBar';
import { InlineModelConfig } from './inlineModelConfig';
import {getClient, grpcPrediction as grpcTritonFetch} from "./tritonGrpc/grpcApi";

export type ModelPrediction = {
    result : string
};

async function getModelPrediction(prefix:string): Promise<ModelPrediction|undefined> {
    if(prefix.length===0){
        return undefined;
    }
    updateStatusBarFetchingPrediction();
    // console.time("API Fetch");
    let completion: string|undefined;
    try{
        const host = "127.0.0.1";
        const port = "81";
        const modelName = InlineModelConfig.getInstance().getName();
        const modelVersion = "";
        const prompt = prefix;

        const client = getClient(host,port);
        completion = await grpcTritonFetch(client,prompt,modelName,modelVersion);
        
    }
    catch (error){
        console.error(error);
    }
    finally{
        // console.timeEnd("API Fetch");
        updateStatusBarArtemusActive();
    }
    if(completion===undefined){
        return undefined;
    }
    return {
        result: completion
    } as ModelPrediction;
}

async function getModelPredictionSimplismart(prefix:string): Promise<ModelPrediction|undefined> {
    if(prefix.length===0){
        return undefined;
    }
    updateStatusBarFetchingPrediction();
    // console.time("API Fetch");
    let completion: string|undefined;
    try{
        const baseUrl = "https://codellama.inference.llm.simplismart.ai";
        const apikey = "demo";
        const modelName = InlineModelConfig.getInstance().getName();
        const prompt = prefix;

        const client = new OpenAI({
            apiKey: apikey,
            baseURL: baseUrl,
        });
        let response = await client.completions.create({
            model: modelName,
            prompt: prompt,
            max_tokens: 128,
            temperature: 0.6,
            stop: "<EOT>",
            stream: false
        });
        completion = response.choices[0].text;
    }
    catch (error){
        console.error(error);
    }
    finally{
        // console.timeEnd("API Fetch");
        updateStatusBarArtemusActive();
    }
    if(completion===undefined){
        return undefined;
    }
    return {
        result: completion.trimEnd()
    } as ModelPrediction;
}


const DEBOUNCE_DELAY = 300; //Debounce helps prevent too many API calls 

function debounce<T extends unknown[], R>(
  callback: (...rest: T) => R,
  limit: number
): (...rest: T) => Promise<R | undefined> {
  let timer: ReturnType<typeof setTimeout>;
    return function (...rest): Promise<R | undefined> {
        return new Promise((resolve) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
            resolve(callback(...rest));
            }, limit);
        });
    };
}

export const debounceCompletions = debounce(getModelPredictionSimplismart, DEBOUNCE_DELAY);