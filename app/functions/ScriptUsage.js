import fs from "fs";
import AdmZip from "adm-zip";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { ResponseHandler } from "../ResponseHandler.js";

export const ScriptUsage = (() => {

    const TAG = "script usage";
    
    const SCRIPT_NAMES = [
        
    ];

    const targetPackages = [ 
        
    ];
    
    const IF_ID_PREFIX = [
      
    ];
    
    const run = async ({ API_URL, accessToken }) => {

        const FILE_NAME = "script_usage.txt";
    
        // 전체 인터페이스 ID 목록 가져오기
        const ifInfoList = await getAllIfInfo(API_URL, accessToken);
        console.log("✅ Entire interface id is fetched successfully.");
    
        // IF ID, IF Name만 추출
        const ifIdAndNameList = extractTargetIfList(ifInfoList);

        // 스크립트 사용처 검색 및 최종 결과물 생성
        console.log("✅ Analyzing interface files...");
        const result = await checkScriptUsage(API_URL, accessToken, ifIdAndNameList);
    
        // 결과물 파일로 리턴
        fs.writeFileSync(
            FILE_NAME, 
            result,
            "utf-8"
        );

        console.log("-".repeat(50));
    
        // 리포트 생성
        report(result);

        console.log("-".repeat(50));

        console.log(`✅ Result is exported to file '${FILE_NAME}'`);

        // 폴더 내 잔여물 삭제
        await clearFolder("./download");
    };
    
    const report = (finalResult) => {
    
        const usageCount = {};
        
        finalResult.split("\n")
            .map(row => row.split(": ")[1].trim())
            .map(str => str.split(" "))
            .forEach(arr => {
                arr.forEach(scriptName => {
                    if (usageCount[scriptName] !== undefined) usageCount[scriptName]++;
                    else usageCount[scriptName] = 1;
                });
            })
    
        const longest = SCRIPT_NAMES.reduce((a, b) => b.length > a.length ? b : a);
        
        SCRIPT_NAMES.forEach(scriptName => console.log(
            `${scriptName}${" ".repeat(longest.length - scriptName.length)} -> ${
                usageCount[scriptName] === undefined 
                    ? 0 : usageCount[scriptName]}`));
    };
    
    const checkScriptUsage = async (apiUrl, accessToken, ifIdAndNameList) => {
    
        const finalResult = [];
    
        for (let i = 0; i < ifIdAndNameList.length; i++) {
    
            const result = await fetchResourceList(
                i, apiUrl, accessToken, ifIdAndNameList[i]
            );
    
            finalResult.push(`${ifIdAndNameList[i].id}: ${result}`);
        }
    
        return finalResult.join("\n");
    };
    
    const fetchResourceList = async (i, apiUrl, accessToken, ifInfo) => {
    
        console.log(`[${" ".repeat(3 - (i + "").length)}${i}] Analyzing ${ifInfo.id}...`);
    
        const response = await fetch(
            `${apiUrl}/api/v1/IntegrationDesigntimeArtifacts(Id='${ifInfo.id}',Version='active')/$value`, {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "Accept"        : "application/json"
            }
        });
    
        return await ResponseHandler.handleResponse(
            response.status === 200,
            async () => inspectZipFile(response, ifInfo),
            response, 
            "Failed to fetch Resource List",
        )
    };

    const inspectZipFile = async (response, ifInfo) => {

        const buffer = await response.arrayBuffer();
        const fileName = `./download/${ifInfo.id}.zip`;
        fs.writeFileSync(fileName, Buffer.from(buffer));
        const zip = new AdmZip(fileName);

        // ZIP 안의 모든 파일 목록 확인
        const iflwEntry = zip.getEntries().find(entry =>
            entry.entryName.startsWith("src/main/resources/scenarioflows/integrationflow/") &&
            entry.entryName.endsWith(".iflw")
        );

        if (iflwEntry) {
            const content = zip.readAsText(iflwEntry);
            const using = SCRIPT_NAMES.filter(name => content.includes(name + ".groovy"));
            
            return using.join(" ");
        }
        else return "no .iflw file";
    }

    const getAllIfInfo = async (apiUrl, accessToken) => {
    
        const list = [];
    
        for (let i = 0; i < targetPackages.length; i++) {
            
            list.push(
                ...await getInterfaceInPackage(
                    apiUrl, accessToken, targetPackages[i]
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

    const clearFolder = async (folderPath) => {
        try {
            const entries = await readdir(folderPath);

            await Promise.all(
                entries.map(async (entry) => {
                    const targetPath = join(folderPath, entry);
                    await rm(targetPath, { recursive: true, force: true });
                })
            );

            console.log(`✅ Cleared contents of: ${folderPath}`);
        } 
        catch (err) {
            console.error(`❌ Failed to clear folder: ${err.message}`);
        }
    };
    
    const extractTargetIfList = (interfaceInfoList) => interfaceInfoList
        .filter(ifInfo => IF_ID_PREFIX.some(prefix => ifInfo.Id.startsWith(prefix)))
        .map(ifInfo => ({ id: ifInfo.Id, name: ifInfo.Name }))

    return {
        TAG, 
        run,
    };
})();