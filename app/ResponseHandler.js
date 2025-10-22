export const ResponseHandler = (() => {

    const handleResponse = async (success, successCb, failedRes, failedMsg) => 
        success ? await successCb() : failCallback(failedRes, failedMsg);

    const failCallback = (response, message) => {
        console.log(response);
        throw new Error(message);
    };

    return {
        handleResponse,
    };
})();