import fs from "fs";

export const VersionChecker = (() => {

    const TAG = "version check";

    const run = () => {

        // 파일 이름 상수
        const FILE_NAME_DEV = `if_metadata_list_DEV.txt`;
        const FILE_NAME_QAS = `if_metadata_list_QAS.txt`;
        const FILE_NAME_PRD = `if_metadata_list_PRD.txt`;

        // 파일을 읽어옴. 
        const devFile = fs.readFileSync(FILE_NAME_DEV, "utf-8");
        const qasFile = fs.readFileSync(FILE_NAME_QAS, "utf-8");
        const prdFile = fs.readFileSync(FILE_NAME_PRD, "utf-8");

        // 읽어온 파일 내용을 오브젝트로 변환
        const devObj = toObject(devFile);
        const qasObj = toObject(qasFile);
        const prdObj = toObject(prdFile);

        // 버전 비교 결과
        const result = compareVersion(devObj, qasObj, prdObj);

        // console.log(result);

        // 결과물을 파일로 리턴
        fs.writeFileSync(
            "version_check_result.json", 
            JSON.stringify(result),
            "utf-8"
        )
    };

    // 파일을 오브젝트로 변환
    const toObject = (file) => {
        
        const result = {};

        // 개행으로 스플릿한 뒤, 
        file.split("\n").forEach(row => {

            // 탭으로 스플릿하여 ifId, version 획득
            const splittedRow = row.split("\t");
            const ifId = splittedRow[0];
            const version = splittedRow[1];

            // result 객체에 키와 값으로 설정
            result[ifId] = version;
        });

        // 결과 리턴
        return result;
    };

    // 세 가지 오브젝트를 받아 prdObj를 기준으로 버전 비교
    const compareVersion = (devObj, qasObj, prdObj) => {

        const result = [];
        
        // prdObj를 기준으로 순회
        Object.entries(prdObj).forEach(([ ifId, version ]) => {

            // 개별 비교 결과를 result 배열에 푸시
            result.push({
                ifId, 
                devVersion: devObj[ifId], // DEV 인터페이스 버전
                qasVersion: qasObj[ifId], // QAS 인터페이스 버전
                prdVersion: version,      // PRD 인터페이스 버전

                // DEV, QAS의 버전이 모두 PRD 버전과 일치해야 true
                match: [ devObj[ifId], qasObj[ifId] ].every(v => v === version),
            });
        });

        // 결과 리턴
        return result;
    };

    return {
        TAG,
        run,
    };
})();