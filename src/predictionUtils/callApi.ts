import fetch, { Response } from 'node-fetch';
import {updateStatusBarBabbageActive, updateStatusBarFetchingPrediction } from '../statusBar/statusBar';
import {InferenceRequest,InferenceResponse} from "./apiSchema";
import assert = require("assert");

export type ModelPrediction = {
    result : string
};

async function getModelPrediction(prefix:string): Promise<ModelPrediction|undefined> {
    updateStatusBarFetchingPrediction();
    console.time("API Fetch");
    let response: Response|undefined;
    try{
        let myUrl = "http://127.0.0.1:8000/v2/models/santacoder_huggingface/infer";
        let inputPrompt:InferenceRequest = {
            inputs:[{
                name:"input",
                shape:[1],
                datatype: "BYTES",
                data:[prefix]
            }]
        };
        response = await fetch(myUrl, {
            method: 'POST',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify(inputPrompt),
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) { 
            console.error(`API Fetch Failed with: (Response Code: ${response.status}) ${response.statusText}`);
        }
    }
    catch (error){
        console.error(error);
    }
    console.timeEnd("API Fetch");
    updateStatusBarBabbageActive();
    
    let inferenceResponse = await (response?.json() as Promise<InferenceResponse>);
    let completion = inferenceResponse['outputs'][0]['data'][0];
    assert(typeof(completion)==="string", `Expected String Output in InferenceResponse. Got {typeof(completion)}`);
    let modelPrediction:ModelPrediction = {
        result: completion
    };
    return modelPrediction;
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

{inputs:[{name:"input", shape:[20], datatype: "BYTES", data:"Complete this string"}]}