import fs from "fs";

export const DestinationConfiguration = (() => {

    const destConfig = JSON.parse(fs.readFileSync("./destConfig.json", "utf-8"));

    return {
        get: (site, destEnumValue) => destConfig[site][destEnumValue],
    };
})();