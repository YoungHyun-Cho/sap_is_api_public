import nodemailer from "nodemailer";

export const Mailer = (() => {

    /** 🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻🔻 */
    const FROM = "발신자 이메일 주소";
    const TO   = "수신자 이메일 주소";
    const APP_PASSWORD = "앱 비밀번호 (유저 비밀번호 X)";
    /** 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺 */

    const sendMail = async (body) => {

        // 1. SMTP 서버 설정
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
            user: FROM,
            pass: APP_PASSWORD,
        }});

        // 2. 메일 옵션
        const mailOptions = {
            from: `"Datastore Notice" <${FROM}>`,
            to: TO,
            subject: "🚨 데이터스토어 사용량 초과",
            text: body,
            html: body,
        };

        // 3. 전송
        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Mail sended : ", info.messageId);
    }

    return {
        sendMail,
    };
})(); 