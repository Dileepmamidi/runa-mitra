export const borrowersListCopy = {
  en: {
    title: "Borrowers",
    count: (n) => `${n} ${n === 1 ? "person" : "people"}`,
    search: "Search by name, village or phone",
    add: "Add borrower",
    emptyTitle: "No borrowers yet",
    emptyText: "Add the first person you have lent money to.",
    noMatchTitle: "No one found",
    noMatchText: "Try a different name, village or phone number."
  },
  te: {
    title: "అప్పుదారులు",
    count: (n) => `${n} మంది`,
    search: "పేరు, ఊరు లేదా ఫోన్‌తో వెతకండి",
    add: "అప్పుదారుని జోడించండి",
    emptyTitle: "ఇంకా అప్పుదారులు లేరు",
    emptyText: "మీరు అప్పు ఇచ్చిన మొదటి వ్యక్తిని జోడించండి.",
    noMatchTitle: "ఎవరూ దొరకలేదు",
    noMatchText: "వేరే పేరు, ఊరు లేదా ఫోన్ నంబర్‌తో వెతకండి."
  }
};
