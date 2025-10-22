 /*******************************************************************************
 * # batch_undeploy.js
 * - 전체 인터페이스 자동 Undeploy
 *   - 배포된 모든 인터페이스들의 인터페이스 ID 조회
 *   - 해당 인터페이스 ID로 Undeploy 요청 전송
 * 
 * - 사용법
 *   1. Node.js 런타임 다운로드
 *   2. 아래 🟥 표기된 설정값들을 모두 설정
 *   3. 터미널에서 이 파일이 위치한 경로까지 이동 
 *      - 예 : cd Onedrive/Desktop -> 경로는 알아서 맞춰주세요. 
 *   4. 스크립트 실행
 *      - 예 : node ./batch_undeploy.js
 *   5. 결과 확인
 *      - 터미널에 성공한 내역이 출력됩니다. 
 *      - 성공한 인터페이스는 undeploy_result.txt 파일에 기록됩니다. 
 ******************************************************************************/

import fs from "fs";
import { ResponseHandler } from "../ResponseHandler.js";
import { ProcessController } from "../ProcessController.js";

export const Undeploy = (() => {

    const TAG = "batch undeploy";
    
    /** 아래 접두어로 시작하는 IF/ID는 모두 Undeploy 대상
     *     - SD : SD로 시작하는 모든 인터페이스 언디플로이
     *     - SD_0049 : SD_0049로 시작하는 모든 인터페이스 언디플로이
     *     - SD_0049_GR312ERP : SD_0049_GR312ERP로 시작하는 모든 인터페이스 언디플로이
    */
    const INCLUDE_PREFIX = [
        
    ];
    
    const run = async ({ API_URL, accessToken }) => {

        const FILE_NAME = "undeploy_result.txt";
    
        // 디플로이 대상 IF ID 목록 구성
        const targetList = await getTargetList(API_URL, accessToken);
        console.log("✅ Undeploy target interfaces fetched.");

        // 작업 대상 출력
        targetList.forEach((el, i) => {
            ++i;
            console.log(`   ${" ".repeat(3 - (i + "").length) + i} | ${el}`);
        })

        // 진행 여부 확인
        await ProcessController.check(TAG);
    
        // 대상 IF 모두 언디플로이 진행
        const result = await undeployAll(API_URL, accessToken, targetList);
        console.log("✅ Undeploy process finished.");
    
        // 결과를 파일로 저장
        fs.writeFileSync(
            FILE_NAME, 
            result.join("\n"), 
            "utf-8"
        );
        
        console.log(`✅ Result is exported to file '${FILE_NAME}'`);
    };
    
    const getTargetList = async (apiUrl, accessToken) => {
        const response = await fetch(
            `${apiUrl}/api/v1/IntegrationRuntimeArtifacts`, {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "Accept"        : "application/json"
            }
        });
    
        return await ResponseHandler.handleResponse(
            response.status === 200,
            async () => extractTargetFromResponse(await response.json()),
            response, 
            "Failed to fetch IF ID",
        )
    };
    
    const undeployAll = async (apiUrl, accessToken, ifidList) => {
    
        const result = [];
        
        for (let i = 0; i < ifidList.length; i++) {
    
            const ifid = ifidList[i];
    
            const response = await fetch(
                `${apiUrl}/api/v1/IntegrationRuntimeArtifacts('${ifid}')`, {
                method : "DELETE",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json"
                }
            });
    
            await ResponseHandler.handleResponse(
                response.status === 202,
                () => {
                    console.log(`✅ Undeploy success - ${ifid}`);
                    result.push(`SUCCESS | ${ifid}`);
                },
                response, 
                `Undeploy failed - ${ifid}`
            );
        }
    
        return result;
    };
    
    const extractTargetFromResponse = (responseBody) => 
        responseBody.d.results
            .map(result => result.Id)
            .filter(ifid => 
                INCLUDE_PREFIX.some(prefix => ifid.startsWith(prefix)));

    return {
        TAG,
        run
    };
})();