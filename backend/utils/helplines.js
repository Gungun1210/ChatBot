

export const HELPLINES = {
  bank_generic: {
    department: 'Your bank — card/UPI helpdesk',
    phone: '1800-XXX-XXXX',
    tollFree: true,
    branch: 'You can also visit your home branch in person with a photo ID and your passbook/statement.',
  },
  npci_upi: {
    department: 'NPCI UPI complaint cell',
    phone: '1800-120-1740',
    tollFree: true,
    branch: 'No branch visit needed — you can also file this complaint online at npci.org.in or inside your UPI app.',
  },
  razorpay_support: {
    department: 'Razorpay merchant support',
    phone: '1800-419-3237',
    tollFree: true,
    branch: 'No branch — handled online via dashboard.razorpay.com/support.',
  },
  hdfc: {
    department: 'HDFC Bank customer care',
    phone: '1800-202-6161',
    tollFree: true,
    branch: 'Nearest HDFC Bank branch — carry a photo ID.',
  },
  icici: {
    department: 'ICICI Bank customer care',
    phone: '1800-1080',
    tollFree: true,
    branch: 'Nearest ICICI Bank branch — carry a photo ID.',
  },
  sbi: {
    department: 'SBI card/UPI helpdesk',
    phone: '1800-1234',
    tollFree: true,
    branch: 'Nearest SBI branch — carry a photo ID.',
  },
}

export function pickHelpline(category) {
  if (category === 'bank_side') return HELPLINES.bank_generic
  if (category === 'upi_side') return HELPLINES.npci_upi
  return HELPLINES.razorpay_support
}


export function buildFallbackScript({ category, amount, txnId, language }) {
  const helpline = pickHelpline(category)

  const templates = {
    hi: `${helpline.department} ko ${helpline.phone} par call karein. Unhe batayein: "Mera ₹${amount} ka payment fail ho gaya, transaction reference ${txnId} hai. Kya paisa kata hai, aur agar kata hai to kab wapas aayega?"`,
    en: `Call ${helpline.department} at ${helpline.phone}. Tell them: "My payment of Rs.${amount} failed with transaction reference ${txnId}. I want to know if the amount was debited and, if so, when it will be reversed."`,
  }
  const script = templates[language] || templates.en

  return { ...helpline, script, language }
}
