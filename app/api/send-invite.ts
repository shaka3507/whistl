// pages/api/send-invite.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// Store these in environment variables for security
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { email, channel } = req.body;

    if (!email || !channel) {
      return res.status(400).json({ error: 'Email and channel are required' });
    }

    const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
    const auth = `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`;

    try {
      const response = await axios.post(
        url,
        new URLSearchParams({
          from: `Your App <mailgun@${MAILGUN_DOMAIN}>`,
          to: email,
          subject: 'You have been invited!',
          text: `You've been invited to join the channel ${channel}.`,
        }),
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return res.status(200).json({ message: 'Invitation sent', mailgunResponse: response.data });
    } catch (error: any) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};