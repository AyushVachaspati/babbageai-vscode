
export type TensorData = (number|string)[];

export type RequestInput = {
    name : string,
    shape : number[],
    datatype : string,
    parameters ?: object[],
    data : TensorData
};

export type RequestOutput = {
    name : string,
    parameters ?: object[],
};

export type ResponseOuptut = {
    name : string,
    shape : number[],
    datatype  : string,
    parameters ?: object[],
    data : TensorData
};

export type InferenceRequest =  {
    id ?: string,
    parameters ?: object[],
    inputs : RequestInput[]
    outputs ?: RequestOutput[] 
};

export type InferenceResponse = {
    modelName : string,
    modelVersion ?: string,
    id : string,
    parameters ?: object[],
    outputs : ResponseOuptut[]
};