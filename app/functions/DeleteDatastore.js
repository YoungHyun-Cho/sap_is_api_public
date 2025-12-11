import { ProcessController } from "../ProcessController.js";

export const DeleteDatastore = (() => {

    const TAG = "delete datastore";

    const MODE = {
        OVERDUE   : "OVERDUE", 
        TIMESTAMP : "TIMESTAMP",
    };

    // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
    const CONFIG = {

        // 삭제 기준 선택
        // MODE.OVERDUE   : 오버듀 엔트리 모두 삭제
        // MODE.TIMESTAMP : 특정 시각 이전의 엔트리 모두 삭제
        MODE      : MODE.TIMESTAMP,

        // 반복 횟수 입력 (1회당 1000개 삭제) 
        // 예 : 삭제 대상이 8000개 -> 8 입력
        ITERATION : 1,

        // 삭제 대상 데이터스토어 이름 
        // 예 : "SD_0121_ERP2SH51" (주의 : 전체 입력 필요 -> SD_0121 X)
        TARGETS   : [
            ""
        ],

        // 매 반복 횟수마다 삭제 진행할건지 물을지 여부
        // 예 : true 또는 false
        CHECK     : true,

        // 모드가 TIMESTAMP일 시, 기준 시각 입력
        // 예 : "Dec 5, 2025, 00:00:00"
        TIMESTAMP :  "Dec 08, 2025, 11:33:23",
    };
    // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥

    // 전체 프로세스 반복 횟수 
    // 참고 : 엔트리는 한 번의 요청으로 1000개씩만 가져올 수 있습니다. 
    //       따라서, 10000개의 오버듀 엔트리를 삭제하려면 '조회->삭제' 과정이 10번 반복되어야 합니다. 

    const run = async ({ API_URL, accessToken }) => {

        for (let i = 0; i < CONFIG.ITERATION; i++) {

            console.log(`🔃 Iteration count : ${i + 1}`);

            // 데이터스토어 이름으로 데이터스토어 모든 엔트리 검색
            const entryMetadata = await fetchEntryMetadata(API_URL, accessToken);

            let filterCallback;
            const doubleCheckArgs = {};

            switch (CONFIG.MODE) {
                case MODE.OVERDUE   : 
                    filterCallback = filterOverdue; 
                    doubleCheckArgs.check   = e => isPassed(e.dueAt) && e.status === "Overdue";
                    doubleCheckArgs.passMsg = "✅ All entries are overdue.";
                    doubleCheckArgs.failMsg = "🚨 At least one entry is not overdue.";
                    break;
                case MODE.TIMESTAMP : 
                    filterCallback = filterBeforeDate; 
                    const t = CONFIG.TIMESTAMP;
                    doubleCheckArgs.check   = e => isBefore(e.createdAt, t);
                    doubleCheckArgs.passMsg = `✅ All entries are before ${t}.`;
                    doubleCheckArgs.failMsg = `🚨 At least one entry is over ${t}.`;
                    break;
                default : throw new Error("Wrong config mode is configured.");
            }
    
            const targetEntries = filterAndMap(entryMetadata, filterCallback);
    
            // 화면 출력
            displayDeleteTargetList(targetEntries);
    
            // 더블 체크
            doubleCheck(
                targetEntries,
                doubleCheckArgs.check,
                doubleCheckArgs.passMsg,
                doubleCheckArgs.failMsg
            );
    
            // 바디로 매핑
            const deleteRequestBody = mapToDeleteBody(targetEntries);
    
            console.log(`✅ Mapping completed : ${targetEntries.length}`);
    
            // 진행 여부 확인
            if (CONFIG.CHECK) await ProcessController.check(TAG);

            console.log(`🔃 Iteration count : ${i + 1}`);
    
            // 오버듀 엔트리 ID 모두 삭제
            await deleteOverdueEntries(API_URL, accessToken, deleteRequestBody);
        }
    };

    const filterOverdue = (e) => e.Status === "Overdue";

    const filterBeforeDate = (e) => {

        const trgDate = new Date(Date.parse(formatKST(parseDateStringKST(e.CreatedAt))));
        const stdDate = new Date(Date.parse(CONFIG.TIMESTAMP));

        return trgDate.getTime() < stdDate.getTime();
    }

    // 모든 엔트리가 오버듀이고, 현재 시점 기준으로 Due가 지났는지 확인
    const doubleCheck = (targetEntries, conditionCallback, sucMsg, errMsg) => {

        const result = targetEntries.every(conditionCallback);

        if (!result) throw new Error(errMsg);

        console.log(sucMsg);
    }

    // 데이터스토어 이름으로 엔트리 메타데이터 복수 조회 
    const fetchEntryMetadata = async (apiUrl, accessToken) => {
        
        let result = [];

        for (let i = 0; i < CONFIG.TARGETS.length; i++) {

            console.log(`✅ Fetching entry metadata started.   : ${CONFIG.TARGETS[i]}`);

            const response = await fetch(
                `${apiUrl}/api/v1/DataStores(` + 
                `DataStoreName='${CONFIG.TARGETS[i]}',` + 
                `IntegrationFlow='${CONFIG.TARGETS[i]}',` + 
                `Type='')/Entries`, {
                method : "GET",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json",
                }
            });

            if (response.status === 200) {
                result = [...result, ...(await response.json()).d.results];
            }
            else if (response.status === 429) { // 429 리턴 시 재시도
                console.log(`🔃 Retry... : ${CONFIG.TARGETS[i]}`);
                i -= 1;
            }
            else {
                throwError(response, "Fetch Datastore Entry Failed");
            }

            console.log(`✅ Fetching entry metadata completed. : ${CONFIG.TARGETS[i]}`);
        }

        return result;
    };

    // 삭제 대상 리스트 출력
    const displayDeleteTargetList = (filtered) => {

        const getNum = (i) => `${" ".repeat(6 - `${(i + 1)}`.length)}${(i + 1)}`;
        const getMid = (i) => `${filtered[i].entryId} (${filtered[i].ifId})`;
        const getEnd = (i) => `DueAt: ${formatKST(filtered[i].dueAt)} | ` + 
                              `CreatedAt: ${formatKST(filtered[i].createdAt)} | ` + 
                              `Overdue: ${isPassed(filtered[i].dueAt)}`; 
        
        for (let i = 0; i < filtered.length; i++) {
            console.log(`${getNum(i)} | ${getMid(i)} | ${getEnd(i)}`);
        }
    };

    // 엔트리 필터링 후 매핑
    const filterAndMap = (fetched, filterCallback) => fetched
        .filter(filterCallback)
        .map(e => ({ 
            status    : e.Status,
            entryId   : e.Id, 
            ifId      : e.IntegrationFlow, 
            createdAt : parseDateStringKST(e.CreatedAt), 
            dueAt     : parseDateStringKST(e.DueAt) 
        })
    );

    // 오버듀 엔트리 일괄 삭제
    const deleteOverdueEntries = async (apiUrl, accessToken, deleteRequestBody) => {

        for (let i = 0; i < deleteRequestBody.length; i++) {

            const serialized = JSON.stringify(deleteRequestBody[i]);

            console.log(`✅ Sending request... : ${deleteRequestBody[i].storeName}`);
            
            const response = await fetch(
                `${apiUrl}/Operations` + 
                `/com.sap.esb.monitoring.datastore.access.command.` + 
                `DeleteDataStoreEntryCommand`, {
                method : "POST",
                headers : {
                    "Authorization" : `Bearer ${accessToken}`,
                    "Accept"        : "application/json",
                    "Content-Type"  : "application/json",
                },
                body: serialized
            });
    
            if (response.status === 200) {
                console.log(
                    `✅ Successfully deleted : ${deleteRequestBody[i].storeName} ` + 
                    `(${deleteRequestBody[i].ids.length} overdue entries)`
                );
            }
            else if (response.status === 429) { // 429 리턴 시 재시도
                console.log(
                    `🔃 Retry............... : ${deleteRequestBody[i].storeName} ` + 
                    `(${deleteRequestBody[i].ids.length} overdue entries)`
                );
                i -= 1;
            }
            else {
                throwError(response, "Delete Datastore Entry Failed");
            }
        }
    };

    // DELETE 시의 Request Body로 데이터 매핑
    const mapToDeleteBody = (overDueEntries) => {
        
        const result = [];

        const findDatastore = (ifId) => result.find(d => d.storeName === ifId);

        for (let i = 0; i < overDueEntries.length; i++) {

            const cur   = overDueEntries[i];
            const found = findDatastore(cur.ifId);
            
            if (findDatastore(cur.ifId)) {
                found.ids.push(cur.entryId);
            }
            else {
                result.push({
                    storeName :   cur.ifId,
                    ids       : [ cur.entryId ],
                    qualifier :   cur.ifId,
                });
            }
        }

        return result;
    }

    // Date(...) 형식 데이터 파싱
    const parseDateStringKST = (input) => {
        const match = input.match(/\d+/);
        if (!match) throw new Error('No timestamp found');

        const timestamp = Number(match[0]);

        return new Date(timestamp);
    };

    // 한국 시간(KST) 기준으로 시간대 보정 및 날짜 형식 맞춰 리턴
    const formatKST = (date) => {
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const kstDate = new Date(utc + 9 * 60 * 60 * 1000);

        const year = kstDate.getFullYear();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[kstDate.getMonth()];
        const day = String(kstDate.getDate()).padStart(2, '0');
        const hours = String(kstDate.getHours()).padStart(2, '0'); // 00~23으로 보장
        const minutes = String(kstDate.getMinutes()).padStart(2, '0');
        const seconds = String(kstDate.getSeconds()).padStart(2, '0');

        return `${month} ${day}, ${year}, ${hours}:${minutes}:${seconds}`;
    };

    // 현재 시각 기준으로 Due가 지났는지 확인
    const isPassed = (dueAt) => {

        const dueDate = new Date(Date.parse(dueAt));
        const now = new Date();

        return now.getTime() > dueDate.getTime();
    };

    const isBefore = (trgDateStr, stdDateStr) => {

        const trgDate = new Date(Date.parse(trgDateStr));
        const stdDate = new Date(Date.parse(stdDateStr));

        return trgDate.getTime() < stdDate.getTime();
    };

    const throwError = (response, errMsg) => {
        console.log(response);
        throw new Error(errMsg);
    };

    return {
        TAG, 
        run,
    };
})(); 