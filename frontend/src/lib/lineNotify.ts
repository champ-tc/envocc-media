import axios from "axios";

export const sendLineGroupMessage = async (
    type: "เบิก" | "ยืม",
    userName: string,
    totalItems: number,
    requestDate: string,
    usagePurpose: string
) => {
    const isBorrow = type === "ยืม";

    const message = {
        type: "flex",
        altText: `📦 แจ้งเตือนการ${type}พัสดุ`,
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: `📢 แจ้งเตือนการ${type}`,
                        weight: "bold",
                        size: "lg",
                        color: "#FFFFFF"
                    }
                ],
                backgroundColor: isBorrow ? "#3498db" : "#2ecc71", // ฟ้า = ยืม / เขียว = เบิก
                paddingAll: "lg",
                paddingTop: "md",
                paddingBottom: "md"
            },
            body: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#FFFFFF",
                spacing: "md",
                contents: [
                    {
                        type: "text",
                        text: type, // "เบิก" หรือ "ยืม"
                        weight: "bold",
                        size: "xl",
                        color: isBorrow ? "#3498db" : "#2ecc71",
                        align: "center",
                    },
                    {
                        type: "separator",
                        margin: "md"
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: `ชื่อผู้ขอ: ${userName}`,
                                wrap: true,
                                size: "md",
                            },
                            {
                                type: "text",
                                text: `จำนวนที่ขอ: ${totalItems} รายการ`,
                                wrap: true,
                                size: "md",
                            },
                            {
                                type: "text",
                                text: `ใช้เพื่อ: ${usagePurpose}`,
                                wrap: true,
                                size: "md",
                            },
                            {
                                type: "text",
                                text: `วันที่ขอ: ${requestDate}`,
                                wrap: true,
                                size: "md",
                            }
                        ]
                    }
                ]
            }
        }
    };

    try {
        const response = await axios.post(
            "https://api.line.me/v2/bot/message/push",
            {
                to: process.env.LINE_GROUP_ID,
                messages: [message],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('LINE Notify Error:', axios.isAxiosError(error)
            ? { code: error.code, status: error.response?.status }
            : { name: error instanceof Error ? error.name : 'UnknownError' });
    }
};
