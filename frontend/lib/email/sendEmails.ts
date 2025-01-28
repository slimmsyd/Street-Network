interface EmailParams {
  clientEmail: string;
  generatedLink: string;
  userDetails: any;
  parsedData?: any;
}

export const sendEmails = async ({
  clientEmail,
  generatedLink,
  userDetails,
  parsedData,
}: EmailParams) => {
  const adminEmailResponse = await fetch("/api/sendEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: userDetails?.user.email,
      subject: `Payment Link For ${parsedData?.suggestedName}`,
      content: `
      Email: ${clientEmail}
      Payment Link: ${generatedLink}
      `,
      isClientEmail: false,
    }),
  });

  const clientEmailResponse = await fetch("/api/sendEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: clientEmail,
      subject: `Proposal Link Sent From ${userDetails?.user.name}`,
      content: `${generatedLink}`,
      isClientEmail: true,
      from: userDetails?.user.email,
    }),
  });

  if (!adminEmailResponse.ok || !clientEmailResponse.ok) {
    throw new Error("Failed to send one or more emails");
  }

  return { success: true };
}; 