"use client";

import { useMemo, useState } from "react";
import { Accordion, Button, SearchField } from "@heroui/react";
import { SearchXIcon } from "lucide-react";
import {
  COMMON_FAQ_COUNT,
  getFaqsForRole,
  type FaqItem,
  type FaqRole,
} from "@/lib/faq/faq-data";
import { filterFaqs } from "@/lib/faq/faq-search";

function FaqAccordion({ faqs }: { faqs: readonly FaqItem[] }) {
  return (
    <Accordion.Root
      key={faqs.map((faq) => faq.id).join(",")}
      variant="surface"
      className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {faqs.map((faq) => (
        <Accordion.Item key={faq.id} id={faq.id}>
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="min-w-0 break-words text-left font-medium text-foreground">
                {faq.question}
              </span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <p className="text-sm leading-6 text-muted">{faq.answer}</p>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function FaqPage({ role }: { role: FaqRole }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const faqs = getFaqsForRole(role);
  const isSearching = query.trim().length > 0;
  const matches = useMemo(() => filterFaqs(faqs, query), [faqs, query]);
  const visibleFaqs = isSearching
    ? matches
    : showAll
      ? faqs
      : faqs.slice(0, COMMON_FAQ_COUNT);

  return (
    <div className="h-full overflow-y-auto p-2 sm:p-3">
      <main className="mx-auto w-full max-w-4xl pb-8">
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Find answers to common questions about using the USP Applicant
            Tracking System.
          </p>
          <SearchField
            fullWidth
            value={query}
            onChange={setQuery}
            aria-label="Search frequently asked questions"
            className="mt-6"
          >
            <SearchField.Group className="border-border">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search frequently asked questions..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </section>

        <section className="mt-6" aria-live="polite">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isSearching ? "Search Results" : "Common Questions"}
              </h2>
              {isSearching ? (
                <p className="mt-1 text-sm text-muted">
                  {matches.length} {matches.length === 1 ? "match" : "matches"}
                </p>
              ) : showAll ? (
                <p className="mt-1 text-sm text-muted">
                  Showing all {faqs.length} questions
                </p>
              ) : null}
            </div>
          </div>

          {visibleFaqs.length > 0 ? (
            <FaqAccordion faqs={visibleFaqs} />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
              <SearchXIcon className="size-10 text-muted" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                No FAQs found
              </h2>
              <p className="mt-1 text-sm text-muted">
                Try a different search term.
              </p>
            </div>
          )}

          {!isSearching ? (
            <div className="mt-4 flex justify-center">
              <Button.Root
                variant="secondary"
                onPress={() => setShowAll((current) => !current)}
                className="rounded-field border border-border bg-surface px-5 text-sm font-medium text-foreground hover:bg-surface-tertiary"
              >
                {showAll ? "Show common questions" : "View all questions"}
              </Button.Root>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
