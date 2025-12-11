import fs from "fs";
import { ResponseHandler } from "../ResponseHandler.js";

export const Metadata = (() => {

    const TAG = "metadata";

    // 🟥 패키지 이름 목록
    const TARGET_PACKAGE_LIST = [ 
        
    ].map(p => p.replace("_", "").replace("-", ""));
    
    const run = async ({ API_URL, accessToken, tag: env }) => {

        const FILE_NAME = `if_metadata_list_${env}.txt`;
    
        // 전체 인터페이스 ID 목록 가져오기
        const ifInfoList = await getAllIfList(API_URL, accessToken);
    
        // IF ID, IF Description만 추출
        const ifIdAndDescList = extractMetadata(ifInfoList);
    
        // 결과 포매팅
        const finalResult = formatResult(ifIdAndDescList);

        // 결과 출력
        finalResult.forEach((el, i) => {
            ++i;
            console.log(`   ${" ".repeat(3 - (i + "").length) + i} | ${el}`);
        });
    
        // 결과물 파일로 리턴
        fs.writeFileSync(
            FILE_NAME, 
            finalResult.join("\n"),
            "utf-8"
        )

        console.log(`✅ Result is exported to file '${FILE_NAME}'`);
    };
    
    const formatResult = (ifIdAndDescList) => ifIdAndDescList
        .map(el => `${el.id}\t${el.version}\t${el.desc}`);
    
    const getAllIfList = async (apiUrl, accessToken) => {
    
        const list = [];
    
        for (let i = 0; i < TARGET_PACKAGE_LIST.length; i++) {
            
            list.push(
                ...await getInterfaceInPackage(
                    apiUrl, accessToken, TARGET_PACKAGE_LIST[i]
                )
            );
        }
    
        return list;
    };
    
    const getInterfaceInPackage = async (apiUrl, accessToken, pkgId) => {
        
        const response = await fetch(
            `${apiUrl}/api/v1/IntegrationPackages('${pkgId}')/IntegrationDesigntimeArtifacts`, {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "Accept"        : "application/json"
            }
        });
    
        return await ResponseHandler.handleResponse(
            response.status === 200,
            async () => (await response.json()).d.results,
            response, 
            "Failed to fetch IF ID",
        )
    };
    
    const extractMetadata = (interfaceInfoList) => interfaceInfoList
        .map(ifInfo => ({ id: ifInfo.Id, desc: ifInfo.Description, version: ifInfo.Version }))

    return {
        TAG, 
        run,
    };
})();