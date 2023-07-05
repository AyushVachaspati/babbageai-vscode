import fetch from 'node-fetch';

export interface Result {
    result: string
}

interface ModelInput  {
    prompt: string
}

async function getModelPrediction(prefix:string): Promise<Result> {
    let myUrl = "http://127.0.0.1:8000/code_complete_test";
    let inputPrompt:ModelInput  = {prompt: prefix};
    // console.time("API Fetch");
    const response = await fetch(myUrl, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify(inputPrompt)
    });
    // console.timeEnd("API Fetch");  
    if (!response.ok) { 
        console.log("Something Went Wrong");
     }
      
      return response.json() as Promise<Result>;
      
}


const DEBOUNCE_DELAY = 500; //Debounce helps prevent too many API calls, also helps user type stuff in which is prefix of suggestion and the suggestion doesnt change. 

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