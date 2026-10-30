/** Pure donation-demo validation and reducer. It never performs I/O. */
export const INITIAL_DONATION_DEMO = Object.freeze({
  amount: 10,
  custom: "",
  message: "",
  view: "supporter",
  status: "idle",
  total: 184,
  count: 12,
  supporters: [],
});

export function validateDemoAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 1 || amount > 500)
    return { ok: false, amount: 0 };
  return { ok: true, amount: Math.round(amount * 100) / 100 };
}

export function donationDemoReducer(state, action) {
  switch (action.type) {
    case "amount":
      return { ...state, amount: action.value, custom: "", status: "idle" };
    case "custom":
      return {
        ...state,
        custom: action.value,
        amount: Number(action.value),
        status: "idle",
      };
    case "message":
      return { ...state, message: action.value.slice(0, 120) };
    case "view":
      return { ...state, view: action.value };
    case "submit": {
      const result = validateDemoAmount(state.amount);
      if (!result.ok) return { ...state, status: "error" };
      return {
        ...state,
        status: "success",
        total: Math.round((state.total + result.amount) * 100) / 100,
        count: state.count + 1,
        supporters: [
          {
            id: action.id,
            name: "A kind stranger",
            amount: result.amount,
            message: state.message,
          },
          ...state.supporters,
        ].slice(0, 4),
      };
    }
    case "settle":
      return { ...state, status: "idle", message: "", custom: "" };
    case "reset":
      return { ...INITIAL_DONATION_DEMO };
    default:
      return state;
  }
}
