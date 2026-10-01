const generateEmailTemplate = (resetPasswordUrl) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
    </head>

    <body style="
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        font-family: Arial, Helvetica, sans-serif;
        color: #222222;
    ">

        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="padding: 40px 15px;"
        >
            <tr>
                <td align="center">

                    <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        role="presentation"
                        style="
                            max-width: 600px;
                            background-color: #ffffff;
                            border: 1px solid #e5e5e5;
                            border-radius: 10px;
                            overflow: hidden;
                        "
                    >

                        <!-- Header -->
                        <tr>
                            <td style="
                                background-color: #111111;
                                padding: 24px 30px;
                                text-align: center;
                            ">
                                <h1 style="
                                    margin: 0;
                                    color: #ffffff;
                                    font-size: 24px;
                                    font-weight: 600;
                                ">
                                    ShopRiva
                                </h1>
                            </td>
                        </tr>


                        <!-- Content -->
                        <tr>
                            <td style="padding: 35px 35px 30px;">

                                <h2 style="
                                    margin: 0 0 20px;
                                    font-size: 22px;
                                    color: #111111;
                                ">
                                    Reset your password
                                </h2>

                                <p style="
                                    margin: 0 0 16px;
                                    font-size: 15px;
                                    line-height: 1.6;
                                    color: #555555;
                                ">
                                    Hello,
                                </p>

                                <p style="
                                    margin: 0 0 25px;
                                    font-size: 15px;
                                    line-height: 1.6;
                                    color: #555555;
                                ">
                                    We received a request to reset the password
                                    associated with your account. Click the button
                                    below to create a new password.
                                </p>


                                <!-- Button -->
                                <table
                                    cellpadding="0"
                                    cellspacing="0"
                                    role="presentation"
                                    style="margin: 0 auto 25px;"
                                >
                                    <tr>
                                        <td
                                            align="center"
                                            bgcolor="#111111"
                                            style="border-radius: 6px;"
                                        >
                                            <a
                                                href="${resetPasswordUrl}"
                                                style="
                                                    display: inline-block;
                                                    padding: 14px 28px;
                                                    font-size: 15px;
                                                    font-weight: bold;
                                                    color: #ffffff;
                                                    text-decoration: none;
                                                "
                                            >
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>


                                <!-- Expiry -->
                                <p style="
                                    margin: 0 0 20px;
                                    padding: 14px 16px;
                                    background-color: #f7f7f7;
                                    border-left: 4px solid #111111;
                                    font-size: 14px;
                                    line-height: 1.6;
                                    color: #555555;
                                ">
                                    For security reasons, this password reset
                                    link will expire in <strong>5 minutes</strong>.
                                </p>


                                <p style="
                                    margin: 0 0 20px;
                                    font-size: 14px;
                                    line-height: 1.6;
                                    color: #666666;
                                ">
                                    If you did not request a password reset,
                                    you can safely ignore this email. Your
                                    password will remain unchanged.
                                </p>


                                <!-- Fallback URL -->
                                <p style="
                                    margin: 25px 0 8px;
                                    font-size: 13px;
                                    color: #777777;
                                ">
                                    If the button doesn't work, copy and paste
                                    this link into your browser:
                                </p>

                                <p style="
                                    margin: 0;
                                    padding: 12px;
                                    background-color: #f5f5f5;
                                    border-radius: 5px;
                                    font-size: 12px;
                                    line-height: 1.5;
                                    word-break: break-all;
                                ">
                                    <a
                                        href="${resetPasswordUrl}"
                                        style="
                                            color: #333333;
                                            text-decoration: none;
                                        "
                                    >
                                        ${resetPasswordUrl}
                                    </a>
                                </p>

                            </td>
                        </tr>


                        <!-- Footer -->
                        <tr>
                            <td style="
                                padding: 22px 30px;
                                background-color: #fafafa;
                                border-top: 1px solid #eeeeee;
                                text-align: center;
                            ">

                                <p style="
                                    margin: 0 0 6px;
                                    font-size: 13px;
                                    color: #666666;
                                ">
                                    Thank you,<br>
                                    <strong>ShopRiva Team</strong>
                                </p>

                                <p style="
                                    margin: 12px 0 0;
                                    font-size: 11px;
                                    line-height: 1.5;
                                    color: #999999;
                                ">
                                    This is an automated security email.
                                    Please do not reply to this message.
                                </p>

                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
};


export default generateEmailTemplate;