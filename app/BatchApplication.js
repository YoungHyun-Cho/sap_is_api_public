import { BackUp } from "./functions/BackUp.js";
import { Deploy } from "./functions/Deploy.js";
import { DestinationConfiguration } from "./DestinationConfiguration.js";
import { Metadata } from "./functions/Metadata.js";
import { ProcessController } from "./ProcessController.js";
import { ScriptUsage } from "./functions/ScriptUsage.js";
import { TokenFetcher } from "./TokenFetcher.js";
import { Undeploy } from "./functions/Undeploy.js";
import { GlobalConstants } from "./GlobalConstants.js";
import { DatastoreUsage } from "./functions/DatastoreUsage.js";

const { DEST_ENUM } = GlobalConstants;

export const Application = (() => {

    /** 🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻 */
    const OPERTATION  = DatastoreUsage;
    const DESTINATION = DEST_ENUM.QAS;

    // 설정 사항 최종 확인 후 true로 변경
    const CONFIRMED = false;
    /** 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */

    const run = async () => {

        // CONFIRMED == false 시 스크립트 실행 즉시 종료 -> 최종 확인 강제
        if (!CONFIRMED) {
            console.log("🚫 Script is locked.")
            process.exit(0);
        }

        // 설정 오브젝트 획득
        const DEST_CONFIG = DestinationConfiguration.get(DESTINATION);

        // 설정 사항 확인
        console.log(`⚠️ Selected opearation is    : ${OPERTATION.TAG}`);
        console.log(`⚠️ Configured destination is : ${DEST_CONFIG.tag}`);

        // 진행 여부 확인
        await ProcessController.check(OPERTATION.TAG);

        console.log(`✅ Starting ${OPERTATION.TAG}...`);

        setInterval(async () => {

            // 액세스 토큰 발급
            const accessToken = await TokenFetcher.fetchAccessToken(DEST_CONFIG);
            console.log("✅ Access token fetch success");
    
            // CSRF 토큰 발급
            const { csrfToken, cookieHeader } = 
                await TokenFetcher.getCsrfToken(DEST_CONFIG, accessToken);
            console.log("✅ CSRF token fetch success");
    
            // 작업 진행
            await OPERTATION.run(
                { ...DEST_CONFIG, accessToken, csrfToken, cookieHeader }
            );
            console.log("✅ Operation completed.");
        }, 10000);
    };

    return {
        run,
    };
})();

Application.run();