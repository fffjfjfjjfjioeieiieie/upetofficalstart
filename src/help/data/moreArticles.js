// Practical guidance for features that exist today. Keep uncertain policy or payment claims out of articles.
const reviewedAt = '17 October 2026';
const article = (slug, title, excerpt, category, sections, tags = [], featured = false) => ({ slug, title, excerpt, category, sections, tags, featured, status: 'published', reviewedAt });

export const moreArticles = [
  article('recover-account-access', 'Recover access to your account', 'Steps to take if you cannot sign in or no longer control your email.', 'account-login', [
    ['Start with the normal recovery route', ['Request a password reset using the exact email attached to your account.', 'Check spam and promotions, and look for a message from the authentication provider.', 'If sign-in has been temporarily limited after repeated attempts, wait before trying again.']],
    ['When you cannot use your old email', ['Email support@user.pet from an address where you can receive replies.', 'Include your profile URL and the old account email if you remember it. Never include a password or recovery code.', 'Support may need to verify ownership before making any change; recovery cannot be guaranteed in every case.']],
    ['After access returns', ['Review your profile and shop for changes you did not make.', 'Set a unique password and check other accounts if you reused the previous password.']],
  ], ['recovery', 'locked out', 'email']),
  article('protect-your-account', 'Recognise phishing and protect your account', 'Spot suspicious links and keep sign-in details private.', 'account-login', [
    ['Keep credentials private', ['Never put a password, reset link or one-time code in a ticket, shop chat or public profile.', 'Use a unique password. A password manager can help you create and store it.', 'Messages demanding immediate action are worth checking independently.']],
    ['Check the address', ['Type user.pet into your browser when a sign-in link looks suspicious.', 'Read the entire domain. Lookalike addresses can copy the site’s appearance.', 'If you entered a password on a suspicious page, reset it and report the page URL.']],
    ['Report it', ['Open a Safety/Abuse ticket and describe the message, account or URL.', 'Avoid reposting a phishing link where others might click it.']],
  ], ['phishing', 'password', 'security']),
  article('request-account-deletion', 'Request account or data deletion', 'Ask the owner team to review an account or data request.', 'account-login', [
    ['Send the request', ['Open a ticket from the affected account if you can sign in.', 'Explain whether you want the account closed, public content removed or information about data held for you.', 'If you cannot sign in, email support@user.pet and include your profile URL.']],
    ['Before you send it', ['Save any profile content you want to keep.', 'Support may ask you to verify account ownership before changing or removing data.', 'A final data retention schedule has not been published; ask support about the current process.']],
  ], ['delete', 'data', 'privacy']),
  article('edit-profile-basics', 'Edit your name, bio and avatar', 'Update the first things people see on your page.', 'profiles-customization', [
    ['Find the controls', ['Sign in and open Dashboard → Editor.', 'Change your display name and bio in the identity controls. Your display name can differ from your permanent username.', 'Upload an avatar in Media and preview its crop on both desktop and mobile.']],
    ['Write a useful bio', ['Explain what visitors can find on your page in one or two clear sentences.', 'Avoid including a home address, personal phone number or other information you do not want shared.', 'Read it on your public profile after saving.']],
    ['Check the image', ['Use artwork you own or have permission to display.', 'If an upload fails, try a supported smaller file and include the error text in a support ticket.']],
  ], ['avatar', 'bio', 'display name']),
  article('preview-and-save-profile', 'Preview and save your profile', 'Check that your changes appear for visitors.', 'profiles-customization', [
    ['While editing', ['Use the live preview to assess layout, text contrast and media.', 'Wait for the saved state before closing the tab. Large uploads can take longer than text changes.', 'Open your public user.pet URL in another tab and reload it to check the published result.']],
    ['When changes do not appear', ['Check whether the editor shows a permission, connection or upload error.', 'Make sure you are signed into the account that owns this profile.', 'Avoid making conflicting edits in multiple tabs. If the issue persists, send support the profile URL and exact error.']],
  ], ['save', 'publish', 'preview']),
  article('use-music-and-lyrics', 'Add music and timed lyrics', 'Set a profile track and optionally add synced lyric lines.', 'profiles-customization', [
    ['Add a track', ['Open Dashboard → Editor → Audio.', 'Upload or link a supported track, then enter its title and artist.', 'Use the public profile to test the mini player. Browsers may stop autoplay until a visitor interacts with the page.']],
    ['Time the words', ['Enable lyrics and enter each line at the timestamp where it begins.', 'Play the track while checking the timing of each line.', 'When enabled, visitors can select the song title to open the lyric view.']],
    ['Rights', ['Only upload music and lyric text you have permission to use.', 'If an upload fails, record the file type, size and error before contacting support.']],
  ], ['music', 'lyrics', 'audio']),
  article('choose-profile-assets', 'Use images, video and effects responsibly', 'Keep your page expressive and readable.', 'profiles-customization', [
    ['Choose media', ['Use art, photos and recordings that you own or may display.', 'Check backgrounds for accidental personal information, such as addresses or document text.', 'Large GIFs and MP4s can be slow on mobile connections.']],
    ['Use motion carefully', ['Avoid rapid flashing and keep controls readable over animated backgrounds.', 'Check the page at phone width, where effects and text compete for less space.', 'Reduce blur and glow when they make links or important text harder to read.']],
  ], ['media', 'video', 'effects']),
  article('link-will-not-open', 'Fix a profile link that will not open', 'Check URL formatting and destination availability.', 'links-widgets', [
    ['Inspect the URL', ['Use the complete https:// address in the link editor.', 'Open the destination outside Upet. If it fails there, the destination may be down or private.', 'Remove spaces accidentally copied before or after the URL.']],
    ['Check the public page', ['Save and reload your profile.', 'Try another browser if the destination uses an app-specific link.', 'For a reproducible Upet issue, include your profile URL and link label in a Bugs ticket.']],
  ], ['links', 'broken url', 'website']),
  article('set-up-your-shop', 'Set up your shop', 'Create a storefront linked from your profile.', 'marketplace', [
    ['Turn it on', ['Open Dashboard → Shop and enable your shop.', 'Choose whether it appears in Marketplace or is only linked from your profile.', 'Add a shop name and a description that tells visitors what you offer.']],
    ['Make it yours', ['Use the Design tab to set colours, layout, typography and a hero image.', 'Add products with names, descriptions and images. Each product can have its own badge, colour and card style.', 'Open the public shop on a phone and desktop to check the final result.']],
    ['Current limits', ['Listings and seller chat are available.', 'Upet checkout, escrow and buyer protection are not live. Buy controls are marked as coming soon.']],
  ], ['shop', 'storefront', 'seller'], true),
  article('add-and-style-products', 'Add and style a shop product', 'Give every listing its own clear details and visual identity.', 'marketplace', [
    ['Describe the item', ['Open Dashboard → Shop → Products and choose Add product.', 'Give it a specific name, type, description and price. Add stock information if it is relevant.', 'Do not make delivery promises or guarantees you cannot verify.']],
    ['Style the card', ['Open Customize for the product to adjust colours, radius, border, glow and image crop.', 'Use badges only when they accurately describe the listing.', 'Check the preview and public shop before sharing it.']],
    ['Keep it current', ['Remove products you no longer offer.', 'Use shop chat for item questions and never request account credentials there.']],
  ], ['product', 'listing', 'shop editor']),
  article('shop-privacy-and-marketplace', 'Choose where your shop appears', 'Control whether Marketplace lists your storefront.', 'marketplace', [
    ['Private setting', ['Choose Private in Dashboard → Shop to keep the shop out of the Marketplace directory.', 'Anyone with the shop URL may still be able to open it. Private means unlisted, not access restricted.']],
    ['Marketplace setting', ['Choose Marketplace to let visitors discover your store.', 'Keep at least one clear product and an accurate shop name.', 'Search Marketplace after saving to confirm the listing appears.']],
  ], ['private shop', 'marketplace', 'visibility']),
  article('chat-with-a-seller', 'Chat with a seller', 'Ask questions from a shop using your Upet profile.', 'marketplace', [
    ['Start a conversation', ['Sign in with your user.pet account and open the seller’s storefront.', 'Write your question under Chat with the seller. Your Upet profile identifies you; you do not need a separate name field.', 'The conversation opens on its own page. Save the URL if you want to return to it.']],
    ['Stay safe', ['Clarify what is being sold and what is included.', 'Never send passwords, reset links, one-time codes or payment card numbers in chat.', 'If a message seems suspicious, stop and report the shop URL through a Safety/Abuse ticket.']],
  ], ['chat', 'seller', 'messages']),
  article('report-a-suspicious-listing', 'Report a suspicious shop listing', 'Flag a misleading, unsafe or impersonating listing.', 'safety-reports', [
    ['What to include', ['Provide the shop URL and product name.', 'Describe the specific issue, such as stolen images, misleading claims or a suspicious external payment request.', 'Summarise any relevant messages without sharing secrets or sensitive personal information.']],
    ['After reporting', ['An owner may review the report and ask for more detail.', 'Do not continue a transaction you no longer trust while waiting.', 'A report is not a refund or payment dispute process.']],
  ], ['report', 'shop', 'listing']),
  article('report-impersonation', 'Report impersonation or stolen work', 'Explain when a profile or product appears to misuse your identity or work.', 'safety-reports', [
    ['Gather links', ['Copy the Upet profile, shop or product URL.', 'If possible, link to your original work or established public identity.', 'Describe your connection to the content and the outcome you are requesting.']],
    ['Send a report', ['Open a Safety/Abuse ticket, or email support@user.pet if you cannot sign in.', 'Do not publish private documents to prove ownership. Support can explain a safer verification path if needed.', 'The team may need more information before acting.']],
  ], ['impersonation', 'copyright', 'identity']),
];
