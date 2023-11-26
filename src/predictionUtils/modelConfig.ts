export const currentCompletionModel = "santacoder";
export const currentChatModel = "santacoderChat";

export const modelConfig = {
    santacoder: {
        name: "santacoder_huggingface",
        prefixToken: "<fim-prefix>",
        suffixToken: "<fim-suffix>",
        middleToken: "<fim-middle>"
    },
    
    starcoder: {
        name: "starcoder_huggingface",
        prefixToken: "<fim_prefix>",
        suffixToken: "<fim_suffix>",
        middleToken: "<fim_middle>"
    },

    santacoderChat: {
        name: "santacoder_huggingface_stream",
    },
    
    starcoderChat: {
        name: "starcoder_huggingface_stream",
    }
};