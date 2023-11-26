import { modelConfig, currentChatModel } from "./modelConfig";
import {getClient, grpcPredictionStream as grpcTritonFetchStream} from "./tritonGrpc/grpcApi";

export function getModelPredictionStream (
    userMsg: string,
    responseCallback: (output:string)=>void,
    endCallback: ()=>void,
    errorCallback: (error:string)=>void)
{
    if(userMsg.length===0){
        errorCallback("Error: Empty User Message.");
        return; 
    }
    try{
        const host = "localhost";
        const port = "81";
        // const modelName = "starcoder_chat";
        const modelName = modelConfig[currentChatModel].name;
        const modelVersion = "";
        const prompt = userMsg;
        const client = getClient(host,port);
        let streamClient = grpcTritonFetchStream(client,prompt,modelName,
                                    modelVersion,responseCallback,
                                    endCallback,errorCallback);
        return streamClient;
    }
    catch (error){
        errorCallback((error as Error).message);
    }
    return undefined;
}
