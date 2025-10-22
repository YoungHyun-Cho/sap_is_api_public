let clickInterval = null;

/* 🔻🔻🔻 CONFIG 설정 🔻🔻🔻 */
const CONFIG = {
    selector: "body > div.GLPCWAHES > div > div:nth-child(2) > div > div.GLPCWAHOID.GLPCWAHBJD > div > table > tbody > tr > td > div > div.GLPCWAHBLC.GLPCWAHJM.GLPCWAHALC > div:nth-child(2) > div.GLPCWAHHFD > div.GLPCWAHGFD > div > div.GLPCWAHA-C.x-toolbar.x-toolbar-mark.x-small-editor.GLPCWAHIO > div > div:nth-child(11) > div > table > tbody > tr:nth-child(2) > td.GLPCWAHA4 > div > div > table > tbody > tr > td > img",
    // selector : "body > div.GLPCWAHES > div > div:nth-child(2) > div > div.GLPCWAHOID.GLPCWAHBJD > div > table > tbody > tr > td > div > div.GLPCWAHBLC.GLPCWAHJM.GLPCWAHALC > div:nth-child(1) > div.GLPCWAHHFD > div.GLPCWAHGFD > div > div.GLPCWAHA-C.x-toolbar.x-toolbar-mark.x-small-editor.GLPCWAHIO > div > div:nth-child(11) > div > table > tbody > tr:nth-child(2) > td.GLPCWAHA4 > div > div > table > tbody > tr > td > img",
    interval: 10000
};
/* 🔺🔺🔺 CONFIG 끝 🔺🔺🔺 */

const div = document.createElement('div');
div.textContent = '자동 리프레시 중...';
Object.assign(div.style, {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: 'red',
    color: 'white',
    padding: '10px',
    zIndex: 10000,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '5px',
    cursor: 'move'
});

const stopBtn = document.createElement('button');
stopBtn.textContent = '정지';
Object.assign(stopBtn.style, {
    padding: '5px 10px',
    backgroundColor: '#fff',
    color: 'red',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
});

const exitBtn = document.createElement('button');
exitBtn.textContent = '종료';
Object.assign(exitBtn.style, {
    padding: '5px 10px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
});

const getRowCount = () => {
  return document.querySelectorAll("tr.GLPCWAHFQD").length;
}

const highlightIfNewRowAdded = (prevCount) => {
    const newCount = getRowCount();
    if (newCount > prevCount) {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        zIndex: 9999,
        cursor: "pointer"
        });

        overlay.onclick = () => overlay.remove();

        document.body.appendChild(overlay);
    }
}


/* 🔻 리프레시 반복 */
const startInterval = () => {
    clickInterval = setInterval(() => {
        const target = document.querySelector(CONFIG.selector);
        if (target) {
        const prevRowCount = getRowCount();
        target.click();
        console.log('리프레시 완료');

        setTimeout(() => {
            highlightIfNewRowAdded(prevRowCount);
        }, 1000); // DOM 반영 대기
        } 
        else {
            console.log('타겟 요소를 찾을 수 없습니다.');
        }
    }, CONFIG.interval);

    div.firstChild.textContent = '자동 리프레시 중...';
    stopBtn.textContent = '정지';
}

const stopInterval = () => {
    clearInterval(clickInterval);
    clickInterval = null;
    div.firstChild.textContent = '자동 리프레시 중지됨';
    stopBtn.textContent = '재시작';
}

stopBtn.onclick = () => {
    if (clickInterval) {
        stopInterval();
    } 
    else {
        startInterval();
    }
};

exitBtn.onclick = () => {
    if (clickInterval) clearInterval(clickInterval);
    clickInterval = null;
    div.remove();
    console.clear();
    console.log('자동 리프레시 종료됨');
};

div.appendChild(stopBtn);
div.appendChild(exitBtn);
document.body.appendChild(div);

startInterval();

let isDragging = false;
let offsetX, offsetY;

div.addEventListener('mousedown', (e) => {
    if (e.target === stopBtn || e.target === exitBtn) return;
    isDragging = true;
    offsetX = e.clientX - div.getBoundingClientRect().left;
    offsetY = e.clientY - div.getBoundingClientRect().top;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    div.style.left = `${e.clientX - offsetX}px`;
    div.style.top = `${e.clientY - offsetY}px`;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});
