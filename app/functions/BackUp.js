import fs from "fs";
import { ResponseHandler } from "../ResponseHandler.js";
import { ProcessController } from "../ProcessController.js";

export const BackUp = (() => {

    const TAG = "back up";
    
    const TARGET_PACKAGE = [
       
    ].map(p => p.replace("_", "").replace("-", ""));
    
    const run = async ({ API_URL, tag, accessToken }) => {
    
        // 모든 패키지 ID 리스트 획득
        const packageIdList = await getAllPackageId(API_URL, accessToken);
        console.log("✅ All package id list fetched.")

        // 대상 패키지 필터링
        const targetPackageList = 
            packageIdList.filter(id => TARGET_PACKAGE.includes(id));

        // 배포 대상 출력
        targetPackageList.forEach((el, i) => {
            ++i;
            console.log(`   ${" ".repeat(3 - (i + "").length) + i} | ${el}`);
        });

        // 진행 여부 확인
        await ProcessController.check(TAG);
    
        // 다운로드 진행
        await downloadPackage(API_URL, tag, accessToken, packageIdList);
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
            async () => (await response.json()).d.results.map(data => data.Id),
            response, 
            "Failed to fetch Resource List",
        )
    };
    
    const downloadPackage = async (apiUrl, tag, accessToken, packageIdList) => {
    
        packageIdList = packageIdList.filter(id => TARGET_PACKAGE.includes(id));
    
        for (let i = 0; i < packageIdList.length; i++) {
    
            console.log(`download ${packageIdList[i]}...`);
    
            const response = await fetch(
                `${apiUrl}/api/v1/IntegrationPackages(Id='${packageIdList[i]}')/$value`, {
                method : "GET",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json"
                }
            });
    
            await ResponseHandler.handleResponse(
                response.status === 200,
                async () => {
                    const buffer = await response.arrayBuffer();
                    const fileName = `./backup/${tag.toLowerCase()}/${packageIdList[i]}.zip`;
                    fs.writeFileSync(fileName, Buffer.from(buffer));
                },
                response, 
                "Failed to fetch Resource List",
            )    
        }
    };

    return {
        TAG, 
        run,
    };
})();