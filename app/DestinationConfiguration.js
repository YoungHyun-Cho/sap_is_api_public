import fs from "fs";

export const DestinationConfiguration = (() => {

    const destConfig = JSON.parse(fs.readFileSync("./destConfig.json", "utf-8"));

    const CONFIG = {

        DEV : {
            tag : destConfig.DEV.tag,
            API_URL : destConfig.DEV.API_URL,
            BASIC_AUTH : {
                ID : destConfig.DEV.BASIC_AUTH.ID,
                PW : destConfig.DEV.BASIC_AUTH.PW,
                TOKEN_URL : destConfig.DEV.BASIC_AUTH.TOKEN_URL,
            },
        },
    
        QAS : {
            tag : destConfig.QAS.tag,
            API_URL : destConfig.QAS.API_URL,
            BASIC_AUTH : {
                ID : destConfig.QAS.BASIC_AUTH.ID,
                PW : destConfig.QAS.BASIC_AUTH.PW,
                TOKEN_URL : destConfig.QAS.BASIC_AUTH.TOKEN_URL,
            },
        },
    
        PRD : {
            tag : destConfig.PRD.tag,
            API_URL : destConfig.PRD.API_URL,
            BASIC_AUTH : {
                ID : destConfig.PRD.BASIC_AUTH.ID,
                PW : destConfig.PRD.BASIC_AUTH.PW,
                TOKEN_URL : destConfig.PRD.BASIC_AUTH.TOKEN_URL,
            },
        },
    };

    return {
        get: (destEnumValue) => CONFIG[destEnumValue],
    };
})();