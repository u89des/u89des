import assert from "node:assert/strict";
import { isStudioPath, normalizeStudioAction, readStudioLocation, studioHref } from "../src/lib/studio-route.js";
import { notificationText, renderNotificationEmail } from "../api/_lib/email-template.js";

assert.equal(isStudioPath("/"), false);
assert.equal(isStudioPath("/studio"), true);
assert.equal(isStudioPath("/studio/project"), true);
assert.equal(studioHref("work-orders", "wo-1"), "/studio?section=work-orders&target=wo-1");
assert.equal(normalizeStudioAction("/workspace/requests/request-1"), "/studio?section=requests&target=request-1");
assert.equal(normalizeStudioAction("/workspace/projects/project-1/contract"), "/studio?section=documents&target=project-1");
assert.equal(normalizeStudioAction("/portal/projects/project-1/finance"), "/studio?section=finance&target=project-1");
assert.equal(normalizeStudioAction("/portal/work-orders/order-1"), "/studio?section=work-orders&target=order-1");
assert.deepEqual(
  readStudioLocation({ pathname: "/studio", search: "?section=briefs&target=project-2", hash: "" }),
  { studio: true, section: "briefs", targetId: "project-2" },
);

const notification = {
  kind: "work_order.proof",
  subject: "بروفة <جديدة>",
  message: "افتح الطلب & راجع الملف.",
};
const html = renderNotificationEmail(notification, "https://www.u89des.com/studio?section=work-orders&target=1");
assert.match(html, /فتح طلب العمل/);
assert.match(html, /بروفة &lt;جديدة&gt;/);
assert.doesNotMatch(html, /بروفة <جديدة>/);
assert.match(notificationText(notification, "https://www.u89des.com/studio"), /https:\/\/www\.u89des\.com\/studio/);
console.log("Studio routing and branded notification email passed.");
