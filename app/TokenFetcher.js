import { ResponseHandler } from "./ResponseHandler.js";

export const TokenFetcher = (() => {

    const fetchAccessToken = async ({ BASIC_AUTH }) => {
    
        const response = await fetch(
            BASIC_AUTH.TOKEN_URL, {
            method : "POST",
            headers : {
                "Content-Type"  : "application/x-www-form-urlencoded",
                "Authorization" : `Basic ${btoa(`${BASIC_AUTH.ID}:${BASIC_AUTH.PW}`)}`,
            },
            body : new URLSearchParams({
                grant_type: "client_credentials",
            })
        });
    
        return await ResponseHandler.handleResponse(
            response.status === 200, 
            async () => (await response.json()).access_token,
            response, 
            "Failed to fetch token",
        );
    };

    const getCsrfToken = async ({ API_URL }, accessToken) => {
        
        const response = await fetch(
            `${API_URL}/api/v1/IntegrationDesigntimeArtifacts`, {
            method : "GET",
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "X-CSRF-Token"  : "Fetch",
            },
        });
    
        return await ResponseHandler.handleResponse(
            response.headers.get("x-csrf-token"), 
            async () => {
                // CSRF 토큰
                const csrfToken = response.headers.get("x-csrf-token");
    
                // 세션 쿠키
                const cookies = response.headers.getSetCookie?.() || [];
    
                // 헤더에 넣을 수 있게 변환
                const cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");
    
                return { csrfToken, cookieHeader };
            },
            response, 
            "Failed to fetch CSRF token",
        );
    };

    return {
        fetchAccessToken,
        getCsrfToken,
    };
})();