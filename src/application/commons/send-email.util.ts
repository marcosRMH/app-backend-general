import * as nodemailer from 'nodemailer';

export class MailService {

  private transporter;

  constructor() {

  }

  async sendMail(
    configEmail: string,
    password: string,
    to: string[],
    mensaje: string,
    subject: string,
    html: string,
    phone: string,
    emailClient: string,
  ) {
    try {

        this.transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configEmail,
        pass: password,
      },
    });

    await this.transporter.sendMail({
      from: configEmail,
      to: to,
      subject: subject,
      html: `

  <div
    style="
      background:#f8fafc;
      padding:40px;
      font-family:Arial,sans-serif;
      color:#1e293b;
    "
  >

    <div
      style="
        max-width:600px;
        margin:auto;
        background:white;
        border-radius:12px;
        padding:30px;
        border:1px solid #e2e8f0;
      "
    >

      <h1
        style="
          margin:0 0 20px 0;
          color:#0f172a;
          font-size:24px;
        "
      >
        Nuevo mensaje desde tu portfolio
      </h1>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          margin-bottom:20px;
        "
      >
        Has recibido una nueva solicitud de contacto.
      </p>

      <table
        style="
          width:100%;
          border-collapse:collapse;
        "
      >

        <tr>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
              font-weight:bold;
              width:120px;
              background:#f8fafc;
            "
          >
            Email
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
            "
          >
            ${emailClient}
          </td>

        </tr>

        <tr>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
              font-weight:bold;
              background:#f8fafc;
            "
          >
            Telefono
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
            "
          >
            ${phone}
          </td>

        </tr>

        <tr>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
              font-weight:bold;
              background:#f8fafc;
              vertical-align:top;
            "
          >
            Mensaje
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e2e8f0;
              line-height:1.6;
            "
          >
           ${mensaje}
          </td>

        </tr>

      </table>

      <p
        style="
          margin-top:30px;
          font-size:14px;
          color:#64748b;
        "
      >
        Este mensaje fue enviado desde el formulario de contacto de tu portfolio.
      </p>

    </div>

  </div>

`,
    });
    }
    catch(e){
        console.log(e);
    }

  }

}
