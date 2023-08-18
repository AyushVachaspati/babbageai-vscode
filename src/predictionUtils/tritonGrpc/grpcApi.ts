
/* eslint-disable @typescript-eslint/naming-convention */
import grpc = require('@grpc/grpc-js');
import protoLoader = require('@grpc/proto-loader');
import util = require('util');
import { ProtoGrpcType } from "./generated/grpc_service";
import { ModelInferResponse, ModelInferResponse__Output } from "./generated/inference/ModelInferResponse";
import { ServerLiveRequest } from "./generated/inference/ServerLiveRequest";
import { GRPCInferenceServiceClient } from "./generated/inference/GRPCInferenceService";
import { ModelMetadataRequest } from "./generated/inference/ModelMetadataRequest";
import { ServerReadyRequest } from "./generated/inference/ServerReadyRequest";
import { ModelInferRequest, _inference_ModelInferRequest_InferInputTensor as ModelInputTensor } from "./generated/inference/ModelInferRequest";
import { ModelStreamInferResponse } from "./generated/inference/ModelStreamInferResponse";

function encode(text:string) {
    return Buffer.from(text,'utf-8');
};

function decodeOutput(outputs:ModelInferResponse__Output| ModelInferResponse) {
    return outputs.raw_output_contents? outputs.raw_output_contents[0].slice(4).toString() : "";
};

export function getClient(host:string,port:string) {
    const PROTO_PATH = __dirname + '/proto/grpc_service.proto';
    const PROTO_IMPORT_PATH = __dirname + '/proto';
    const grpcServicePackageDefition = protoLoader.loadSync(PROTO_PATH, {
        includeDirs: [PROTO_IMPORT_PATH],
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

    const inference = (grpc.loadPackageDefinition(grpcServicePackageDefition) as unknown as ProtoGrpcType).inference;
    const client = new inference.GRPCInferenceService(host + ':' + port, grpc.credentials.createInsecure());
    return client;
}

 async function isServerLive(client: GRPCInferenceServiceClient) {
    const serverLive = util.promisify(client.serverLive).bind(client);
    let serverLiveResponse = await serverLive({} as ServerLiveRequest);
    return serverLiveResponse?.live;
}

 async function isServerReady(client: GRPCInferenceServiceClient) {
    const serverReady = util.promisify(client.serverReady).bind(client);    
    let serverReadyResponse = await serverReady({} as ServerReadyRequest);
    return serverReadyResponse?.ready;
}

 async function getModelMetaData(
    client:GRPCInferenceServiceClient,
    modelName: string,
    modelVersion: string) {
    const modelMetadata = util.promisify(client.modelMetadata).bind(client);
    let modelMetadataResponse = await modelMetadata({ 
        name: modelName,
        version: modelVersion 
    } as ModelMetadataRequest);
    return modelMetadataResponse;
}

 export async function grpcPrediction(
    client: GRPCInferenceServiceClient,
    prompt: string,
    modelName: string,
    modelVersion: string,
    batchSize: number = 1,
    dimension: number = 1
    ) {
    const modelInfer = util.promisify(client.modelInfer).bind(client);
    const input:ModelInputTensor = {
        name: "input",
        datatype: "BYTES",
        shape: [batchSize,dimension],
        contents: {
            bytes_contents: [encode(prompt)]
        }
    };

    const modelInferRequest:ModelInferRequest = {
        model_name: modelName,
        model_version: modelVersion,
        inputs: [input],
        outputs:[
            {
                name:"output"
            }
        ]
    };

    const response = await modelInfer(modelInferRequest);

    //first 4 Bytes Specify the length of the output. Ignoring for now.
    return  response ? decodeOutput(response) : undefined;
}

 export function grpcPredictionStream(
    client: GRPCInferenceServiceClient,
    prompt: string,
    modelName: string,
    modelVersion: string,
    responseCallback: (output:string)=>void,
    endCallback: ()=>void,
    errorCallback: (error:string)=>void,
    batchSize: number = 1,
    dimension: number = 1) 
{
    try{
        const streamClient = client.ModelStreamInfer();
        const input:ModelInputTensor = {
            name: "input",
            datatype: "BYTES",
            shape: [batchSize, dimension],
            contents: {
                bytes_contents: [encode(prompt)]
            }
        };

        const modelInferRequest:ModelInferRequest = {
            model_name: modelName,
            model_version: modelVersion,
            inputs: [input],
            outputs:[
                {
                    name:"output"
                }
            ]
        };
        
        streamClient.write(modelInferRequest);
        streamClient.on('data', (response:ModelStreamInferResponse) => {
            let errorResponse = response.error_message;
            let inferResponse = response.infer_response;
            if(errorResponse){
                streamClient.end();
                errorCallback(errorResponse);
                return;
            }
            if(inferResponse){
                if(!inferResponse.parameters?.triton_final_response.bool_param){
                        responseCallback(decodeOutput(inferResponse));
                        // streamClient.cancel();
                }
            else{
                    streamClient.end();
                    endCallback();
                }
            }
        });
        streamClient.on('error', (error:grpc.ServerErrorResponse) => {
            let errorResponse = error.message;
            // streamClient.end();
            errorCallback(errorResponse);
        });
        return streamClient;
        }
    catch(error){
        errorCallback((error as Error).message);
        return undefined;
    }
    return undefined;
}