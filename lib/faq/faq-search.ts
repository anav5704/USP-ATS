import type { FaqItem } from "@/lib/faq/faq-data";

export function filterFaqs(
  faqs: readonly FaqItem[],
  query: string
): readonly FaqItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return faqs;

  return faqs.filter((faq) =>
    [faq.question, faq.answer, ...faq.keywords].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery)
    )
  );
}
