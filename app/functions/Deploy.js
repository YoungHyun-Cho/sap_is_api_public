import fs from "fs";
import { ProcessController } from "../ProcessController.js";
import { ResponseHandler } from "../ResponseHandler.js";

export const Deploy = (() => {

    const TAG = "batch deploy";
 
    // 🟥 인터페이스 ID 일부 목록
    const PARTIAL_IF_ID_LIST = [
        
    ];

    // 🟥 타겟 패키지 ID 목록
    const TARGET_PACKAGE_LIST = [ 
        
    ].map(p => p.replace("_", "").replace("-", ""));
    
    const run = async ({ API_URL, accessToken, csrfToken, cookieHeader }) => {

        if (PARTIAL_IF_ID_LIST.length <= 0 || TARGET_PACKAGE_LIST.length <= 0) {
            console.log("⚠️ Empty keywords or empty target packages.");
            return;
        }

        const FILE_NAME = "deploy_results.json";
    
        // 전체 패키지 ID 목록 가져오기
        const allPackageList = await getAllPackageId(API_URL, accessToken);
    
        // 전체 캐피지 내 SYSCODE와 연계된 인터페이스 ID 가져오기
        const allIfList = await getAllIfList(API_URL, accessToken, allPackageList);
    
        // 타겟 인터페이스 필터링
        const targetIfList = extractTargetIf(allIfList);
    
        console.log("✅ Deploy targets are filtered : ");
    
        // 배포 대상 출력
        targetIfList.forEach((el, i) => {
            ++i;
            console.log(`   ${" ".repeat(3 - (i + "").length) + i} | ${el}`);
        })
    
        // 진행 여부 확인
        await ProcessController.check(TAG);

        console.log("✅ Starting batch deployment...");
    
        // 전체 배포 진행
        const finalResult = await deployAll(
            API_URL, accessToken, csrfToken, cookieHeader, targetIfList
        );

        console.log("✅ Batch deploy completed - result is exported to deploy_results.json");

        // 결과를 파일로 내보내기
        fs.writeFileSync(
            FILE_NAME,
            JSON.stringify(finalResult),
            "utf-8"
        );

        console.log(`✅ Result is exported to file '${FILE_NAME}'`);
    };
    
    const deployAll = async (apiUrl, accessToken, csrfToken, cookieHeader, targetIfList) => {
    
        const finalResult = [];
    
        for (let i = 0; i < targetIfList.length; i++) {
    
            const response = await fetch(
                `${apiUrl}/api/v1/DeployIntegrationDesigntimeArtifact` + 
                `?Id='${targetIfList[i]}'&Version='active'`, {
                method : "POST",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json",
                    "Cookie"        : cookieHeader,
                    "X-CSRF-Token"  : csrfToken
                }
            });
    
            await ResponseHandler.handleResponse(
                response.status === 202, 
                async () => {
                    const result = `${targetIfList[i]} (Task Id : ${await response.text()})`;
                    
                    console.log("  ✅ Deploy Success - " + result);
    
                    finalResult.push(result);
                },
                response, 
                "Deploy Failed",
            );
        }
    
        return finalResult;
    };
    
    const getAllPackageId = async (apiUrl, accessToken) => {
    
        const response = await fetch(
            `${apiUrl}/api/v1/IntegrationPackages`, {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "Accept"        : "application/json"
            }
        });
    
        return await ResponseHandler.handleResponse(
            response.status === 200,
            async () => 
                (await response.json()).d.results
                    .map(el => el.Id)
                    .filter(id => TARGET_PACKAGE_LIST.includes(id)),
            response, 
            "Failed to fetch IF ID",
        )
    };
    
    const getAllIfList = async (apiUrl, accessToken, packageIdList) => {
    
        let targetInterfaceList = [];
    
        for (let i = 0; i < packageIdList.length; i++) {
    
            console.log(`✅ Searching target interface in ${packageIdList[i]}...`)
    
            const response = await fetch(
                `${apiUrl}/api/v1/IntegrationPackages('${packageIdList[i]}')` + 
                `/IntegrationDesigntimeArtifacts`, {
                method : "GET",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json"
                }
            });
        
            await ResponseHandler.handleResponse(
                response.status === 200,
                async () => targetInterfaceList = [ 
                    ...targetInterfaceList, 
                    ...(await response.json()).d.results.map(el => el.Id) 
                ],
                response, 
                "Failed to fetch IF ID",
            )
    
        }
    
        return targetInterfaceList;
    };
    
    // 타겟 인터페이스 목록 추출
    const extractTargetIf = (ifIdList) => 
        ifIdList.filter(ifId => 
            PARTIAL_IF_ID_LIST.some(keyword => 
                keyword.split("_").every(el => ifId.includes(el)))).sort();
    
    return {
        TAG,
        run,
    };
})();