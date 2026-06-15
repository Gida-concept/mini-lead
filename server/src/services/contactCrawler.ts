import type { LeadCreateInput } from '../types/index.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const EMAIL_RE = /[\w.-]+@[\w.-]+\.\w{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}/g;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 10000;
const MAX_CONCURRENT = 3;

function extractEmailPhone(html: string): { email: string | null; phone: string | null } {
  const $ = cheerio.load(html);
  const text = $('body').text();

  // Extract from mailto: links
  const mailtoEmails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0];
    if (email) mailtoEmails.push(email);
  });

  // Extract from text
  const textEmails = text.match(EMAIL_RE) || [];
  const allEmails = [...new Set([...textEmails, ...mailtoEmails])];

  // Filter common non-business emails
  const businessEmail = allEmails.find(e =>
    !e.startsWith('admin@') && !e.startsWith('noreply@') && !e.startsWith('support@') && !e.startsWith('contact@')
  ) || allEmails[0] || null;

  // Extract phone numbers
  const phones = text.match(PHONE_RE) || [];
  const validPhones = phones.filter(p => {
    const digits = p.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  });
  const phone = validPhones[0] || null;

  return { email: businessEmail, phone };
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      maxRedirects: 3,
      headers: { 'User-Agent': USER_AGENT },
    });
    return typeof response.data === 'string' ? response.data : String(response.data);
  } catch {
    return null;
  }
}

async function tryContactPages(baseUrl: string): Promise<string | null> {
  const paths = ['/contact', '/contact-us', '/about', '/about-us'];
  for (const path of paths) {
    const html = await fetchPage(`${baseUrl.replace(/\/$/, '')}${path}`);
    if (html) return html;
  }
  return null;
}

export const contactCrawler = {
  async enrich(leads: LeadCreateInput[]): Promise<LeadCreateInput[]> {
    const results: LeadCreateInput[] = [];

    for (let i = 0; i < leads.length; i += MAX_CONCURRENT) {
      const batch = leads.slice(i, i + MAX_CONCURRENT);
      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          if (!lead.page_url) return lead;
          if (lead.email && lead.phone) return lead;

          const html = await fetchPage(lead.page_url);
          if (!html) return lead;

          const { email, phone } = extractEmailPhone(html);
          let finalEmail = email || lead.email;
          const finalPhone = phone || lead.phone;

          if (!finalEmail) {
            const contactHtml = await tryContactPages(lead.page_url);
            if (contactHtml) {
              const contactExtracted = extractEmailPhone(contactHtml);
              finalEmail = contactExtracted.email || null;
            }
          }

          return { ...lead, email: finalEmail, phone: finalPhone };
        }),
      );

      results.push(...batchResults);
    }

    return results;
  },
};
