# 사용 방법

### 의존성 라이브러리 다운로드
- 터미널에서 npm install

### API 호출 정보 설정
- destConfig.json 파일 만들고 아래와 같은 형식으로 API 호출 정보 설정

```json
{
    "DEV": {
        "tag": "DEV",
        "API_URL": "https://....cfapps.ap12.hana.ondemand.com",
        "BASIC_AUTH": {
            "ID": "...",
            "PW": "...",
            "TOKEN_URL": "https://....authentication.ap12.hana.ondemand.com/oauth/token"
        }
    },
    "QAS": {
        "tag": "QAS",
        "API_URL": "https://....cfapps.ap12.hana.ondemand.com",
        "BASIC_AUTH": {
            "ID": "...",
            "PW": "...",
            "TOKEN_URL": "https://....authentication.ap12.hana.ondemand.com/oauth/token"
        }
    },
    "PRD": {
        "tag": "PRD",
        "API_URL": "https://....cfapps.ap12.hana.ondemand.com",
        "BASIC_AUTH": {
            "ID": "...",
            "PW": "...",
            "TOKEN_URL": "https://....authentication.ap12.hana.ondemand.com/oauth/token"
        }
    }
}
```

### 작업 설정
- functions에서 작업 대상 인터페이스 이름 또는 패키지 등을 설정
- Application.js 또는 BatchApplication.js에서 수행할 작업 및 작업 대상 환경(DEV, QAS, PRD) 설정
- 작업 및 작업 대상 최종 확인 후 Application.js 또는 BatchApplication.js의 confirmed를 true 할당 