import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_FAQS,
  COMMON_FAQ_COUNT,
  MEMBER_FAQS,
  getFaqsForRole,
} from "@/lib/faq/faq-data";
import { filterFaqs } from "@/lib/faq/faq-search";

test("FAQ collections remain role-specific and contain the requested totals", () => {
  assert.equal(ADMIN_FAQS.length, 20);
  assert.equal(MEMBER_FAQS.length, 21);
  assert.equal(getFaqsForRole("admin"), ADMIN_FAQS);
  assert.equal(getFaqsForRole("member"), MEMBER_FAQS);
  assert.equal(COMMON_FAQ_COUNT, 6);

  const adminIds = new Set(ADMIN_FAQS.map((faq) => faq.id));
  assert.equal(
    MEMBER_FAQS.some((faq) => adminIds.has(faq.id)),
    false
  );
});

test("FAQ search trims input and matches case-insensitive partial text", () => {
  const results = filterFaqs(ADMIN_FAQS, "  ArChIvE  ");

  assert.ok(results.length > 0);
  assert.ok(results.some((faq) => faq.id === "admin-archive-job"));
});

test("FAQ search checks questions, answers, and keywords across hidden items", () => {
  assert.ok(
    filterFaqs(MEMBER_FAQS, "appearance").some(
      (faq) => faq.id === "member-theme"
    )
  );
  assert.ok(
    filterFaqs(MEMBER_FAQS, "administrators").some(
      (faq) => faq.id === "member-ai-decision"
    )
  );
  assert.ok(
    filterFaqs(ADMIN_FAQS, "permanent").some(
      (faq) => faq.id === "admin-permanent-delete"
    )
  );
});

test("blank FAQ search restores the full collection and unknown terms are empty", () => {
  assert.equal(filterFaqs(MEMBER_FAQS, "   "), MEMBER_FAQS);
  assert.deepEqual(filterFaqs(MEMBER_FAQS, "no-such-faq-term"), []);
});
