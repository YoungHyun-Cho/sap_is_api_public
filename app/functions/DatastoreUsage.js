import { Mailer } from "../Mailer.js";
import { ResponseHandler } from "../ResponseHandler.js";

export const DatastoreUsage = (() => {

    const TAG = "datastore usage";

    // 1GB == 1073741824bytes
    const _1GB = 1073741824;

    // 본 스크립트에서는 다른 모듈이 API URL과 토큰을 주입해줍니다. 
    const run = async ({ API_URL, accessToken }) => {

        // API를 호출하여 데이터스토어 사용 정보를 가져옵니다. 
        const datastoreMetadata = await fetchDataStoreMetadata(API_URL, accessToken);

        // 총량과 사용량을 산출합니다. 
        const { total, used } = extractDatastoreUsage(datastoreMetadata);

        // 결과를 출력합니다. 
        console.log(`✅ Current status : ${used}GB / ${total}GB`);
        
        // 사용량이 총량과 같거나 초과되었다면 로그를 출력합니다. 
        if (used >= total) {

            console.log(`🟥 Datastore usage exceeded ${total}GB.`);
            await Mailer.sendMail([
                `Current status : ${used}GB / ${total}GB. `,
                `Datastore usage exceeded ${total}GB.`
            ].join("\n"));
        }
    };

    // 데이터스토어 사용량 정보를 가져옵니다. 
    const fetchDataStoreMetadata = async (apiUrl, accessToken) => {

        // URL 쿼리 파라미터에 들어갈 현재 시각과 1시간 전 시각
        const { currentHour, oneHourBefore } = getCurrentAndOneHourBefore();

        // API 호출 (API 인스턴스 내 URL + 개발자도구 네트워크 탭에서 긁어온 경로)
        const response = await fetch([
                `${apiUrl}/api/v1/resourceusage?`,
                `type=datastore-usage&`, 
                `time=hourly&`,
                `from=${oneHourBefore}&`,
                `to=${currentHour}&`,
                `timezoneid=Asia/Seoul`
            ].join(""), {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`, // 헤더에 토큰 설정 필요
            },
        });
    
        // 성공하면 JSON으로 결과 파싱하여 리턴, 실패하면 실패 메세지 출력
        return await ResponseHandler.handleResponse(
            response.status === 200, 
            async () => await response.json(),
            response, 
            "Failed to fetch datastore usage.",
        );
    };

    // 가져온 데이터스토어 사용량 정보로부터 사용 용량과 총량을 산출합니다. 
    const extractDatastoreUsage = (datastoreMetadata) => {

        // 총량 (전체 사용 가능량)
        const total = datastoreMetadata["total-available"];

        // 중복 제거 -> value 합산 => 사용 용량
        const used = Array.from(
            new Map(
                datastoreMetadata["resource-usage"].map(el => [el.context, el])
            ).values()
        ).reduce((acc, cur) => acc + cur.value, 0);

        // GB 단위로 소수점 둘 째 자리까지 보전하여 오브젝트로 리턴
        return { total: floor2(total / _1GB), used: floor2(used / _1GB) };
    };

    // 현재 시각과 1시간 이전 시각 리턴
    const getCurrentAndOneHourBefore = () => {

        const now = new Date();

        const currentHour = new Date(now);
        currentHour.setMinutes(0, 0, 0);

        const oneHourBefore = new Date(currentHour);
        oneHourBefore.setHours(currentHour.getHours() - 1);

        return {
            currentHour: currentHour.toISOString(),
            oneHourBefore: oneHourBefore.toISOString()
        };
    };

    // 소수점 둘 째 자리까지만 보전
    const floor2 = (num) => Math.floor(num * 100) / 100;

    return {
        TAG, 
        run,
    };
})();