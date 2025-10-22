export const GlobalConstants = (() => {

    const DEST_ENUM = {
        get DEV() { return "DEV"; },
        get QAS() { return "QAS"; },
        get PRD() { return "PRD"; },
    };

    return {
        DEST_ENUM,
    };
})();