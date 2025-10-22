import readline from "readline";

export const ProcessController = (() => {

    const check = async (operationName) => {

        const READ_LINE = readline.createInterface({
            input  : process.stdin,
            output : process.stdout
        });

        // 외부에서 호출 시 await로 흐름 동기화할 수 있도록 프로미스로 래핑
        const answer = await new Promise((resolve) => {
            READ_LINE.question(
                "⚠️ Confirm? (Y/N) : ", (input) => resolve(input)
            );
        });

        if (answer.toUpperCase() !== "Y") {
            console.log(`🚫 Terminate ${operationName} process.`);
            process.exit(0);
        }

        READ_LINE.close();
    };

    return {
        check,
    };
})();