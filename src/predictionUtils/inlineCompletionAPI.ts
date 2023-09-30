import {updateStatusBarArtemusActive, updateStatusBarFetchingPrediction } from '../statusBar/statusBar';
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
        const host = "localhost";
        const port = "81";
        const modelName = "starcoder_huggingface";
        const modelVersion = "";
        const prompt = prefix;

        const client = getClient(host,port);
        completion = await grpcTritonFetch(client,prompt,modelName,modelVersion);
        
    }
    catch (error){
        console.error(error);
    }
    // console.timeEnd("API Fetch");
    updateStatusBarArtemusActive();
    
    if(completion===undefined){
        return undefined;
    }
    return {
        result: completion
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

export const debounceCompletions = debounce(getModelPrediction, DEBOUNCE_DELAY);