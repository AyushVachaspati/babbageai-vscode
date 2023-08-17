import {updateStatusBarArtemusActive, updateStatusBarFetchingPrediction } from '../statusBar/statusBar';
import {getClient, grpcPredictionStream as grpcTritonFetchStream} from "./tritonGrpc/grpcApi";

export async function getModelPredictionStream (
    userMsg: string,
    responseCallback: (output:string)=>void,
    endCallback: ()=>void,
    errorCallback: (error:string)=>void): Promise<undefined>
{
    if(userMsg.length===0){
        errorCallback("Error: Empty User Message.");
        return undefined; 
    }

    updateStatusBarFetchingPrediction();
    console.time("Chat API Fetch");
    try{
        const host = "localhost";
        const port = "81";
        const modelName = "santacoder_huggingface_stream";
        const modelVersion = "";
        const prompt = userMsg;
        const client = getClient(host,port);
        grpcTritonFetchStream(client,prompt,modelName,
                                    modelVersion,responseCallback,
                                    endCallback,errorCallback);
    }
    catch (error){
        errorCallback((error as Error).message);
    }
    console.timeEnd("Chat API Fetch");
    updateStatusBarArtemusActive();
}
