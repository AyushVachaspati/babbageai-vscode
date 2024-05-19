enum InlineModelName {
    santaCoder,
    starCoder,
    codeLlama
}

export class InlineModelConfig {
    private static instance: InlineModelConfig;
    private static currentModel = InlineModelName.codeLlama;
    
    private constructor() {
        // Private constructor to prevent direct instantiation
    }

    public static getInstance(): InlineModelConfig {
        if (!InlineModelConfig.instance) {
            InlineModelConfig.instance = new InlineModelConfig();
        }
        return InlineModelConfig.instance;
      }

    getPrefixToken(): string{
        switch(InlineModelConfig.currentModel){
            case InlineModelName.santaCoder: {
                return "<fim-prefix>";
            }
            case(InlineModelName.starCoder): {
                return "<fim_prefix>";
            }
            case(InlineModelName.codeLlama): {
                return "";
            }
        }
    }

    getSuffixToken(): string{
        switch(InlineModelConfig.currentModel){
            case(InlineModelName.santaCoder): {
                return "<fim-suffix>";
            }
            case(InlineModelName.starCoder): {
                return "<fim_suffix>";
            }
            case(InlineModelName.codeLlama): {
                return "";
            }
        }
    }

    getMiddleToken(): string{
        switch(InlineModelConfig.currentModel){
            case(InlineModelName.santaCoder): {
                return "<fim-middle>";
            }
            case(InlineModelName.starCoder): {
                return "<fim_middle>";
            }
            case(InlineModelName.codeLlama): {
                return "<FILL_ME>";
            }
        }
    }

    getName(): string{
        switch(InlineModelConfig.currentModel){
            case(InlineModelName.santaCoder): {
                return "santacoder_huggingface";
            }
            case(InlineModelName.starCoder): {
                return "starcoder_huggingface";
            }
            case(InlineModelName.codeLlama): {
                return "codellama";
            }
        }
    }
}