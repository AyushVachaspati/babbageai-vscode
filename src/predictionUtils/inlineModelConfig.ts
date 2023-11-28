enum InlineModelName {
    santaCoder,
    starCoder,
}

export class InlineModelConfig {
    private static instance: InlineModelConfig;
    private static currentModel = InlineModelName.santaCoder;
    
    private constructor() {
        // Private constructor to prevent direct instantiation
    }

    public static getInstance(): InlineModelConfig {
        console.log("getting new instnac")
        if (!InlineModelConfig.instance) {
            InlineModelConfig.instance = new InlineModelConfig();
        }
        return InlineModelConfig.instance;
      }

    getPrefixToken(): String{
        switch(InlineModelConfig.currentModel){
            case InlineModelName.santaCoder: {
                return "<fim-prefix>";
            }
            case(InlineModelName.starCoder): {
                return "<fim_prefix>";
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
        }
    }
}