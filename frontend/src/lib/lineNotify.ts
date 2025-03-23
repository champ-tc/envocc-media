import axios from "axios";

export const sendLineGroupMessage = async (
    type: "เบิก" | "ยืม",
    userName: string,
    totalItems: number,
    requestDate: string,
    usagePurpose: string
) => {
    const message = {
        type: "flex",
        altText: `แจ้งเตือนการ${type}`,
        contents: {
            type: "bubble",
            size: "mega",
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
                        color: "#00B900", // สีเขียว LINE
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
                                text: `นำไปใช้เพื่อ: ${usagePurpose}`,
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

        console.log("✅ LINE Flex message sent");
        return response.data;
    } catch (error) {
        console.error("❌ Error sending LINE Flex message:");
    }
};
