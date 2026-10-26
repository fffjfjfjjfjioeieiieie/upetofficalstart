import { Link2, Palette, Shield, UserRound } from 'lucide-react';
import { moreArticles } from './moreArticles';

export const categories = [
  { slug: 'account-login', name: 'Account & Login', description: 'Signing in, passwords and account access.', icon: UserRound, available: true },
  { slug: 'profiles-customization', name: 'Profiles & Customization', description: 'Build, style and publish your user.pet page.', icon: Palette, available: true },
  { slug: 'links-widgets', name: 'Links & Widgets', description: 'Add useful links and connected content.', icon: Link2, available: true },
  { slug: 'safety-reports', name: 'Safety & Reports', description: 'Protect yourself and report a concern.', icon: Shield, available: true },
];

const reviewedAt = '17 October 2026';
const article = (slug, title, excerpt, category, sections, tags = [], featured = false) => ({ slug, title, excerpt, category, sections, tags, featured, status: 'published', reviewedAt });

export const articles = [
  article('sign-in-to-upet', 'Sign in to Upet', 'Use your approved account to access your dashboard and profile.', 'account-login', [
    ['Sign in', ['Open user.pet and choose Log in.', 'Enter the email address attached to your account and your password.', 'After successful authentication, Upet opens your dashboard or asks you to claim a username.']],
    ['If sign-in fails', ['Check that the email address is spelled correctly.', 'Use the password reset link rather than repeatedly guessing.', 'If access is still unavailable, open a support ticket from this Help Centre.']],
  ], ['login', 'account'], true),
  article('reset-your-password', 'Change or reset your password', 'Send a secure Firebase password-reset email from the login or settings page.', 'account-login', [
    ['Reset a forgotten password', ['Open the Upet login page and enter your account email.', 'Choose Forgot password.', 'Open the message from Firebase and follow its secure reset link.']],
    ['Stay safe', ['Upet staff should never ask you to send your password in a ticket or chat.', 'Check the destination before entering credentials.']],
  ], ['password', 'security'], true),
  article('claim-a-username', 'Claim a username', 'Choose the handle used in your public user.pet URL.', 'profiles-customization', [
    ['Before claiming', ['Usernames become part of your public URL and are currently permanent.', 'Choose carefully and avoid including private information.']],
    ['Claim it', ['Sign in to an approved account.', 'Enter an available username on the claim screen.', 'Confirm it to create your profile.', 'You can later change the username in Dashboard → Settings once every two hours.']],
  ], ['username', 'profile'], true),
  article('customize-your-profile', 'Customize your profile', 'Change profile media, card styling, effects, links and audio.', 'profiles-customization', [
    ['Open the editor', ['Sign in and open Dashboard.', 'Choose Editor from the navigation.', 'Use Media, Effects, Card, Links and Audio to make changes.']],
    ['Saving', ['Changes save automatically after a short pause.', 'Wait for the saved state before closing the page.', 'Use your public profile URL to verify the published result.']],
  ], ['editor', 'effects', 'media'], true),
  article('fix-failed-uploads', 'Fix failed uploads', 'Troubleshoot profile media that will not upload or display.', 'profiles-customization', [
    ['Check the file', ['Use a supported image, GIF, video or audio format for that field.', 'Try a smaller file if the upload exceeds the displayed limit.', 'Keep the page open until the upload completes.']],
    ['Still failing', ['Refresh and sign in again to renew your session.', 'Record the file type and visible error, then include both in a support ticket.']],
  ], ['uploads', 'media']),
  article('add-profile-links', 'Add links to your profile', 'Create links and control how they appear on your page.', 'links-widgets', [
    ['Add a link', ['Open Dashboard and then Editor.', 'Choose Links and enter a clear label and complete https URL.', 'Review the destination before sharing your profile.']],
    ['Link safety', ['Do not link to phishing, malware, credential theft or unlawful content.', 'You are responsible for destinations you add.']],
  ], ['links', 'widgets']),
  article('report-a-safety-concern', 'Report an account or safety concern', 'Send enough information for an Upet owner to review a concern.', 'safety-reports', [
    ['Submit a report', ['Open a new support ticket and choose Safety/Abuse.', 'Include the profile URL and a factual description of what happened.', 'Do not repost harmful material when a URL or description is sufficient.']],
    ['Immediate danger', ['Upet tickets are not an emergency service.', 'Contact local emergency services when someone faces immediate danger.']],
  ], ['report', 'abuse', 'safety'], true),
  article('protect-personal-information', 'Protect your personal information', 'Reduce the personal information exposed through profiles and messages.', 'safety-reports', [
    ['Profile privacy', ['Avoid publishing home addresses, private phone numbers or authentication details.', 'Review uploaded media for hidden or background information.', 'Remove links that reveal more than you intend.']],
    ['Suspicious contact', ['Do not send passwords, recovery links or one-time codes.', 'Block contact off-platform when appropriate and report the account to Upet.']],
  ], ['privacy', 'security']),
  ...moreArticles,
];

export const categoryBySlug = (slug) => categories.find((category) => category.slug === slug);
export const articleBySlug = (slug) => articles.find((entry) => entry.slug === slug && entry.status === 'published');
export const searchArticles = (query, category = '') => {
  const needle = String(query || '').trim().toLowerCase();
  return articles.filter((entry) => entry.status === 'published' && (!category || entry.category === category) && (!needle || `${entry.title} ${entry.excerpt} ${entry.tags.join(' ')} ${entry.sections.flatMap(([heading, steps]) => [heading, ...steps]).join(' ')}`.toLowerCase().includes(needle)));
};
