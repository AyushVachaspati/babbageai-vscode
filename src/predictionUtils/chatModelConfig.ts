enum ChatModelName {
    santaCoder,
    starCoder,
}

export class ChatModelConfig {
    private static instance: ChatModelConfig;
    private static currentModel = ChatModelName.starCoder;

    private constructor() {
        // Private constructor to prevent direct instantiation
    }

    public static getInstance(): ChatModelConfig {
        if (!ChatModelConfig.instance) {
          ChatModelConfig.instance = new ChatModelConfig();
        }
        return ChatModelConfig.instance;
      }

    public getName(): string{
        switch(ChatModelConfig.currentModel){
            case(ChatModelName.santaCoder): {
                return "santacoder_huggingface_stream";
            }
            case(ChatModelName.starCoder): {
                return "starcoder_chat";
            }
        }
    }
}