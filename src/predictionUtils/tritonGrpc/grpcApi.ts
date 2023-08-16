
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
    return outputs.raw_output_contents? outputs.raw_output_contents[0].slice(4).toString() : undefined;
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

 async function getModelPrediction(
    client: GRPCInferenceServiceClient,
    prompt: string,
    modelName: string,
    modelVersion: string
    ) {
    const modelInfer = util.promisify(client.modelInfer).bind(client);
    const input:ModelInputTensor = {
        name: "input",
        datatype: "BYTES",
        shape: [1,1],
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

 export async function getModelPredictionStream(
    client: GRPCInferenceServiceClient,
    prompt: string,
    modelName: string,
    modelVersion: string,
    callback: (output:any)=>void) {
    const streamClient = client.ModelStreamInfer();
    const input:ModelInputTensor = {
        name: "input",
        datatype: "BYTES",
        shape: [1,1],
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
            console.error(errorResponse);
            return;
        }
        if(inferResponse){
            if(!inferResponse.parameters?.triton_final_response.bool_param){
                callback(decodeOutput(inferResponse));
            }
           else{
                streamClient.end();
                callback('<|endoftext|>');
            }
        }
    });
}



async function main() {
    const host = "localhost";
    const port = "8001";
    const client = getClient(host,port);
    
    const modelName = "santacoder_huggingface_stream";
    const modelVersion = "";
    const batchSize = 1;
    const dimension = 1;

    console.log("Server Live: ",await isServerLive(client));
    console.log("Server Ready: ",await isServerReady(client));
    console.log("Model Metadata: ",await getModelMetaData(client,modelName,modelVersion));
    const prompt = "def fib(n):";
    // console.log("Model Prediction: \n",await getModelPrediction(client,prompt,modelName,modelVersion));
    // // const prompt =  `def fib(n):`;
    await getModelPredictionStream(client,prompt,modelName,modelVersion,(output) => {process.stdout.write(output);});
}
// main();