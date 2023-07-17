import fetch, { Response } from 'node-fetch';
import {updateStatusBarBabbageActive, updateStatusBarFetchingPrediction } from '../statusBar/statusBar';

export interface Result {
    result: string
}

interface ModelInput  {
    prompt: string
}

async function getModelPrediction(prefix:string): Promise<Result|undefined> {
    updateStatusBarFetchingPrediction();

    console.time("API Fetch");
    let response: Response|undefined;
    try{
        let myUrl = "http://127.0.0.1:8000/code_complete_test";
        let inputPrompt:ModelInput  = {prompt: prefix};
        response = await fetch(myUrl, {
            method: 'POST',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify(inputPrompt),
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) { 
            console.log(`API Fetch Failed with: (Response Code: ${response.status}) ${response.statusText}`);
        }
    }
    catch (error){
        console.log(error);
    } 
    console.timeEnd("API Fetch");

    updateStatusBarBabbageActive();
    
    return response?.json() as Promise<Result|undefined>;
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