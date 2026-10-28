export const STRIPE_ESTIMATE_RATE = 0.015;
export const STRIPE_ESTIMATE_FIXED = 20;
export const PLATFORM_MARGIN_RATE = 0.02;

export function calculateDonationFee(amount, { charityApproved = false } = {}) {
  if (!Number.isInteger(amount) || amount < 0) throw new TypeError('Amount must be a non-negative integer.');
  const rate = STRIPE_ESTIMATE_RATE + (charityApproved ? 0 : PLATFORM_MARGIN_RATE);
  return Math.round(amount * rate) + STRIPE_ESTIMATE_FIXED;
}

export function calculateDonationCharge(pledgedAmount, { charityApproved = false, coverFees = false } = {}) {
  if (!Number.isInteger(pledgedAmount) || pledgedAmount < 0) throw new TypeError('Pledged amount must be a non-negative integer.');
  if (!coverFees) return { chargeAmount: pledgedAmount, fee: calculateDonationFee(pledgedAmount, { charityApproved }) };
  const rate = STRIPE_ESTIMATE_RATE + (charityApproved ? 0 : PLATFORM_MARGIN_RATE);
  let chargeAmount = Math.ceil((pledgedAmount + STRIPE_ESTIMATE_FIXED) / (1 - rate));
  while (chargeAmount - calculateDonationFee(chargeAmount, { charityApproved }) < pledgedAmount) chargeAmount += 1;
  while (chargeAmount > pledgedAmount && chargeAmount - 1 - calculateDonationFee(chargeAmount - 1, { charityApproved }) >= pledgedAmount) chargeAmount -= 1;
  return { chargeAmount, fee: calculateDonationFee(chargeAmount, { charityApproved }) };
}
