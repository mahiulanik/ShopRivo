import { Resend } from "resend";


const resend = new Resend(
    process.env.RESEND_API_KEY
);


const sendEmail = async (
    email,
    subject,
    message
) => {

    const { data, error } =
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: email,
            subject,
            html: message,
        });


    if (error) {

        console.error(
            "Resend error:",
            error
        );

        throw new Error(
            error.message
        );
    }


    return data;
};


export default sendEmail;