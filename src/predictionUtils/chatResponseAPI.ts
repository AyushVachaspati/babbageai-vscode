import { ChatCompletionMessageParam } from "openai/resources";
import { ChatModelConfig } from "./chatModelConfig";
import {getClient, grpcPredictionStream as grpcTritonFetchStream} from "./tritonGrpc/grpcApi";
import OpenAI from "openai";
import { sleep } from "openai/core";
import { Stream } from "openai/streaming";


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
        const modelName = ChatModelConfig.getInstance().getName();
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


export async function getModelPredictionStreamSimplismart (
    userMsg: ChatCompletionMessageParam[],
    errorCallback: (error:string)=>void
    )
{
    if(userMsg.length===0){
        errorCallback("Error: Empty User Message.");
        return; 
    }
    try{
        const openai = new OpenAI({
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            baseURL: 'https://starchat.inference.llm.simplismart.ai',
            dangerouslyAllowBrowser: true
        });
        const modelName = ChatModelConfig.getInstance().getName();
        const prompt = userMsg;
        
        const streamClient = await openai.chat.completions.create({
            model: "starchat",
            messages: prompt,
            stream: true,
            temperature: 1,
            max_tokens: 512,
            top_p: 1
          });
        return streamClient;
    }
    catch (error){
        errorCallback((error as Error).message);
    }
    return undefined;
}

export async function startOutputStreaming(
    streamClient: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>,
    responseCallback: (output:string)=>void,
    endCallback: ()=>void,
    errorCallback: (error:string)=>void){
    try{
        for await (const chunk of streamClient) {
            responseCallback(chunk.choices[0]?.delta?.content || "");
        }
        endCallback();
    }
    catch(error){
        console.error(error)
        errorCallback((error as Error).message);
    }
}