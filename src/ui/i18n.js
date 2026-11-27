const languageKey = 'sotorko-ui-language';
const languages = ['en', 'bn'];

// Pairs keep the languages side by side and make changes to the interface easy to review.
const strings = {
  'shift.title': ['District shift handover', 'জেলাভিত্তিক দায়িত্ব হস্তান্তর'],
  'shift.time': ['Simulation snapshot · {time}', 'মহড়ার বর্তমান অবস্থা · {time}'],
  'shift.download': ['Download handover', 'প্রতিবেদন ডাউনলোড'],
  'shift.figures': ['Households alerted: {alerted} · Reported safe: {safe} · Awaiting reply: {awaiting} · Open cases: {open}', 'সতর্কবার্তা পাঠানো পরিবার: {alerted} · নিরাপদ বলে জানিয়েছে: {safe} · উত্তরের অপেক্ষায়: {awaiting} · চলমান কেস: {open}'],
  'shift.triage': ['Review open cases', 'চলমান কেস দেখুন'],
  'shift.alerts': ['Review pending alert', 'অপেক্ষমাণ সতর্কবার্তা দেখুন'],
  'shift.replies': ['Check household replies', 'পরিবারগুলোর উত্তর দেখুন'],
  'shift.river-panel': ['Monitor river levels', 'নদীর পানির স্তর দেখুন'],
  'page.title': ['Sotorko AI | Flood Response Console', 'সতর্ক এআই | বন্যা মোকাবিলা ড্যাশবোর্ড'],
  'nav.label': ['Dashboard sections', 'ড্যাশবোর্ডের বিভাগ'],
  'nav.jump': ['Jump to a dashboard section', 'ড্যাশবোর্ডের একটি বিভাগ বেছে নিন'],
  'nav.overview': ['Overview', 'সারসংক্ষেপ'],
  'nav.guide': ['Guided demo', 'ধাপে ধাপে মহড়া'],
  'nav.alerts': ['Alert approvals', 'সতর্কবার্তা অনুমোদন'],
  'nav.shelters': ['Shelter capacity', 'আশ্রয়কেন্দ্রের ধারণক্ষমতা'],
  'nav.replies': ['Citizen replies', 'নাগরিকদের উত্তর'],
  'nav.phone': ['Citizen phone', 'নাগরিকের ফোন'],
  'nav.triage': ['Rescue triage', 'উদ্ধারের অগ্রাধিকার'],
  'nav.messages': ['Outbound messages', 'পাঠানো বার্তা'],
  'nav.activity': ['Agent timeline', 'এজেন্টদের কার্যক্রম'],
  'ui.skip': ['Skip to main content', 'মূল অংশে যান'],
  'ui.team': ['Team Cady Crush', 'টিম ক্যাডি ক্রাশ'],
  'ui.operations': ['Operations', 'কার্যক্রম'],
  'ui.bangladesh': ['Bangladesh', 'বাংলাদেশ'],
  'ui.simulation': ['Simulation · মহড়া', 'মহড়া · Simulation'],
  'ui.language': ['Language', 'ভাষা'],
  'ui.theme': ['Theme', 'থিম'],
  'ui.themeLight': ['Light', 'উজ্জ্বল'],
  'ui.themeDark': ['Dark', 'গাঢ়'],
  'hero.eyebrow': ['Bangladesh flood drill', 'বাংলাদেশের বন্যা মহড়া'],
  'hero.title': ['Flood response, step by step', 'ধাপে ধাপে বন্যা মোকাবিলা'],
  'hero.intro': [
    'Replay rising river levels. Approve Bangla alerts, guide families to shelter, and follow up when people need help.',
    'নদীর পানি বাড়ার মহড়া চালান। বাংলা সতর্কবার্তা অনুমোদন করুন, পরিবারকে আশ্রয়কেন্দ্রে পাঠান ও সাহায্যের প্রয়োজন হলে খোঁজ নিন।',
  ],
  'hero.advance': ['Advance 15 min', '১৫ মিনিট এগিয়ে যান'],
  'hero.startGuide': ['Start guided demo', 'নির্দেশনাসহ মহড়া শুরু'],
  'hero.complete': ['Replay complete', 'মহড়া শেষ'],
  'hero.reset': ['Reset demo', 'মহড়া আবার শুরু করুন'],
  'hero.resetConfirm': ['Clear the current demo and return to 08:00?', 'বর্তমান মহড়ার তথ্য মুছে সকাল ০৮:০০-তে ফিরে যাবেন?'],
  'hero.mapCaption': ['Schematic monitoring map', 'নদী পর্যবেক্ষণের সরল মানচিত্র'],
  'hero.pauseMotion': ['Pause motion', 'অ্যানিমেশন থামান'],
  'hero.playMotion': ['Resume motion', 'অ্যানিমেশন চালান'],
  'hero.notice': [
    'This is a training simulation. The readings, households and shelters are fictional. Messages and rescue cases stay in this demo.',
    'এটি একটি প্রশিক্ষণ মহড়া। পরিমাপের তথ্য, পরিবার ও আশ্রয়কেন্দ্র কাল্পনিক। বার্তা ও উদ্ধারের নথি এই মহড়ার মধ্যেই থাকে।',
  ],
  'metric.time': ['Replay time (BST)', 'মহড়ার সময় (বাংলাদেশ সময়)'],
  'metric.approvals': ['Awaiting approval', 'অনুমোদনের অপেক্ষায়'],
  'metric.messages': ['Simulated messages', 'মহড়ার বার্তা'],
  'metric.cases': ['Open triage cases', 'চলমান উদ্ধার নথি'],
  'metric.replayRange': ['{start} to {end}', '{start} থেকে {end}'],
  'metric.timeDelta': ['Advanced {count} min', '{count} মিনিট এগিয়েছে'],
  'metric.delta': ['{delta} this update', 'এই ধাপে {delta}'],
  'metric.approvalsDetail': ['Officer review queue', 'কর্মকর্তার পর্যালোচনার তালিকা'],
  'metric.messagesDetail': ['SMS, WhatsApp and voice', 'এসএমএস, হোয়াটসঅ্যাপ ও ফোনকল'],
  'metric.casesDetail': ['Cases awaiting closure', 'নিষ্পত্তির অপেক্ষায় থাকা নথি'],

  'pipeline.label': ['Agent pipeline', 'এজেন্টদের কাজের ধাপ'],
  'pipeline.monitor': ['Monitor', 'পর্যবেক্ষণ'],
  'pipeline.assess': ['Assess', 'মূল্যায়ন'],
  'pipeline.approve': ['Approve', 'অনুমোদন'],
  'pipeline.shelter': ['Shelter', 'আশ্রয় বরাদ্দ'],
  'pipeline.notify': ['Notify', 'বার্তা পাঠান'],
  'pipeline.replies': ['Replies', 'উত্তর'],
  'pipeline.triage': ['Triage', 'উদ্ধারের অগ্রাধিকার'],
  'pipeline.escalate': ['Escalate', 'স্বেচ্ছাসেবককে জানান'],
  'pipeline.done': ['Completed', 'সম্পন্ন'],

  'footer.track': ['Agentic AI & Autonomous Systems · MU CSE FEST 2026', 'এজেন্টিক এআই ও স্বয়ংক্রিয় সিস্টেম · এমইউ সিএসই ফেস্ট ২০২৬'],
  'footer.proposal': ['Project proposal', 'প্রকল্প প্রস্তাবনা'],
  'footer.github': ['GitHub', 'গিটহাব'],

  'guide.heading': ['Guided demo', 'ধাপে ধাপে মহড়া'],
  'guide.next': ['Next step', 'পরের ধাপ'],
  'guide.back': ['Back', 'আগের ধাপ'],
  'guide.skip': ['Skip', 'এড়িয়ে যান'],
  'guide.restart': ['Restart guide', 'নির্দেশিকা আবার শুরু করুন'],
  'guide.reviewCases': ['Review triage', 'উদ্ধারের নথি দেখুন'],
  'guide.step': ['Step {step} of {total}', '{total} ধাপের মধ্যে {step}'],
  'guide.progress': ['Demo progress', 'মহড়ার অগ্রগতি'],
  'guide.blocked': ['Complete the highlighted action to continue.', 'এগিয়ে যেতে চিহ্নিত কাজটি করুন।'],
  'guide.skipToStart': ['Restart the demo to follow the guide from the beginning.', 'প্রথম ধাপ থেকে নির্দেশিকা অনুসরণ করতে মহড়া আবার শুরু করুন।'],
  'guide.targetMissing': ['The next control is unavailable in this run. Restart the guide to try again.', 'এই মহড়ায় পরের ধাপের নিয়ন্ত্রণটি দেখা যাচ্ছে না। আবার চেষ্টা করতে নির্দেশিকা নতুন করে শুরু করুন।'],
  'guide.step1.title': ['Watch the river rise', 'নদীর পানি বেড়ে যাওয়া দেখুন'],
  'guide.step1.detail': ['Advance 15 minutes. The risk assessor will flag Sylhet for officer review.', '১৫ মিনিট এগিয়ে যান। ঝুঁকি মূল্যায়নকারী সিলেটের সতর্কবার্তা কর্মকর্তার পর্যালোচনার জন্য পাঠাবে।'],
  'guide.step2.title': ['Approve Sylhet’s alert', 'সিলেটের সতর্কবার্তা অনুমোদন করুন'],
  'guide.step2.detail': ['Approve the alert for Sylhet to queue Bangla messages and reserve shelter space.', 'বাংলা বার্তা প্রস্তুত করতে এবং আশ্রয়কেন্দ্রে জায়গা বরাদ্দ করতে সিলেটের সতর্কবার্তাটি অনুমোদন করুন।'],
  'guide.step3.title': ['Fill the first shelter', 'প্রথম আশ্রয়কেন্দ্রটি পূর্ণ দেখান'],
  'guide.step3.detail': ['Mark Sylhet School Shelter as full. Watch the agents send families to the community hall.', 'সিলেট স্কুল আশ্রয়কেন্দ্রটি পূর্ণ দেখান। এজেন্টরা পরিবারগুলোকে কীভাবে কমিউনিটি হলে পাঠায়, তা দেখুন।'],
  'guide.step4.title': ['Send two citizen replies', 'দুই নাগরিকের উত্তর পাঠান'],
  'guide.step4.detail': ['In the citizen phone, mark Rahima safe and send Jamal’s rescue sample. Leave Salma’s phone unanswered.', 'নাগরিকের ফোনে রহিমাকে নিরাপদ দেখান এবং জামালের উদ্ধারের নমুনা পাঠান। সালমার পক্ষ থেকে উত্তর দেবেন না।'],
  'guide.step5.title': ['Check the follow-up call', 'খোঁজ নেওয়ার কলটি দেখুন'],
  'guide.step5.detail': ['Advance to 08:30. Salma will receive a simulated Bangla call because she has not replied.', 'সকাল ০৮:৩০-এ যান। উত্তর না পাওয়ায় মহড়ায় সালমাকে বাংলায় ফোন করা হবে।'],
  'guide.step6.title': ['See an unanswered alert escalate', 'উত্তর না পেলে কী হয় দেখুন'],
  'guide.step6.detail': ['Advance to 08:45. Check the rescue queue for Salma’s case and the ward volunteer note.', 'সকাল ০৮:৪৫-এ যান। উদ্ধার তালিকায় সালমার নথি ও ওয়ার্ড স্বেচ্ছাসেবকের জন্য নির্দেশনাটি দেখুন।'],
  'guide.complete.title': ['You completed the demo', 'আপনি মহড়া শেষ করেছেন'],
  'guide.complete.detail': ['Review the agent timeline to see why the alert, shelter change, follow-up and escalation happened.', 'সতর্কবার্তা, আশ্রয়কেন্দ্র বদল, খোঁজ নেওয়ার কল ও স্বেচ্ছাসেবকের কাছে পাঠানোর কারণ জানতে এজেন্টদের কার্যক্রম দেখুন।'],

  'river.heading': ['River level replay', 'নদীর পানির উচ্চতা'],
  'river.detail': ['Water level at each observation time', 'প্রতিটি পর্যবেক্ষণের সময় পানির উচ্চতা'],
  'river.area': ['Monitoring area', 'পর্যবেক্ষণের এলাকা'],
  'river.chart': ['Simulated river levels', 'মহড়ায় নদীর পানির উচ্চতা'],
  'river.level': ['River level', 'পানির উচ্চতা'],
  'river.threshold': ['Demo danger threshold', 'মহড়ার বিপৎসীমা'],
  'river.thresholdShort': ['Danger line', 'বিপৎসীমা'],
  'river.keyboardHint': ['Use the left and right arrow keys to inspect recorded observations.', 'পর্যবেক্ষণের তথ্য দেখতে বাম ও ডান তীরচিহ্নের বোতাম চাপুন।'],
  'river.chartDescription': ['{area} river levels. Demo danger threshold {threshold} metres. {readings}.', '{area} এলাকার নদীর পানির উচ্চতা। মহড়ার বিপৎসীমা {threshold} মিটার। {readings}।'],
  'river.chartReading': ['{time} at {level} metres', '{time}-এ {level} মিটার'],
  'risk.heading': ['Area risk', 'এলাকাভিত্তিক ঝুঁকি'],
  'risk.detail': ['Latest readings and risk scores', 'সর্বশেষ পরিমাপ ও ঝুঁকির স্কোর'],
  'risk.weather': ['{river} · {level} m · {rain} mm rain', '{river} · {level} মিটার · {rain} মিমি বৃষ্টি'],
  'risk.score': ['Risk score {score}/100', 'ঝুঁকির স্কোর {score}/১০০'],
  'risk.scoreLabel': ['{area} demo risk score', '{area} এলাকার মহড়ার ঝুঁকির স্কোর'],
  'risk.levelAgainstThreshold': ['{level} / {threshold} m', '{level} / {threshold} মিটার'],
  'risk.levelBar': ['Water level {level} metres against a danger threshold of {threshold} metres', 'পানির উচ্চতা {level} মিটার, বিপৎসীমা {threshold} মিটার'],

  'alerts.heading': ['Alert approvals', 'সতর্কবার্তা অনুমোদন'],
  'alerts.detail': ['An officer must approve severe alerts before they are sent.', 'গুরুতর সতর্কবার্তা পাঠানোর আগে কর্মকর্তার অনুমোদন লাগবে।'],
  'alerts.approve': ['Approve', 'অনুমোদন করুন'],
  'alerts.reject': ['Reject', 'বাতিল করুন'],
  'alerts.empty': ['No severe alerts. Advance the replay to see how rising levels affect risk.', 'গুরুতর সতর্কবার্তা নেই। পানি বাড়লে ঝুঁকি কীভাবে বদলায় দেখতে মহড়া এগিয়ে নিন।'],
  'alerts.reraised': ['Raised again at {time} because the river kept rising after the alert was rejected.', 'বার্তাটি বাতিল করার পরও পানি বাড়ায় {time}-এ আবার তা পর্যালোচনার জন্য তোলা হয়েছে।'],
  'alerts.reraisedTag': ['Re-raised', 'আবার তোলা হয়েছে'],
  'alerts.thresholdCrossed': ['The river passed the danger threshold at {time}.', '{time}-এ নদীর পানি বিপৎসীমায় পৌঁছেছে।'],
  'shelters.heading': ['Shelter capacity', 'আশ্রয়কেন্দ্রের ধারণক্ষমতা'],
  'shelters.detail': ['Available places account for demo reservations.', 'পরিবারগুলোর জন্য বরাদ্দ রাখার পর যে জায়গা খালি আছে তা দেখুন।'],
  'shelters.markAvailable': ['Mark available', 'খালি জায়গা আছে দেখান'],
  'shelters.simulateFull': ['Simulate full', 'পূর্ণ দেখান'],
  'shelters.unassigned': ['No shelter space assigned', 'আশ্রয়কেন্দ্রে জায়গা বরাদ্দ হয়নি'],
  'shelters.placesFree': ['{count} places free', '{count} জনের জায়গা খালি'],
  'shelters.capacityFree': ['{count} of {total} free', '{total} জনের মধ্যে {count} জনের জায়গা খালি'],
  'shelters.placesUsed': ['Places used at {shelter}', '{shelter}-এ বরাদ্দ জায়গা'],
  'shelters.stats': ['{area} · {distance} km · {capacity} total places', '{area} · {distance} কিমি · মোট {capacity} জনের জায়গা'],

  'replies.heading': ['Citizen replies', 'নাগরিকদের উত্তর'],
  'replies.detail': ['Send a simulated Bangla text or keypad reply.', 'মহড়ায় বাংলায় লিখে বা নম্বর চেপে উত্তর দিন।'],
  'replies.empty': ['Approve an alert to unlock replies from demo households.', 'মহড়ার পরিবারগুলোর পক্ষ থেকে উত্তর দিতে একটি সতর্কবার্তা অনুমোদন করুন।'],
  'replies.household': ['Household', 'পরিবার'],
  'replies.reply': ['Reply', 'উত্তর'],
  'replies.placeholder': ['আমরা আটকে আছি, ৫ জন', 'আমরা আটকে আছি, ৫ জন'],
  'replies.safeSample': ['Safe · ১', 'নিরাপদ · ১'],
  'replies.rescueSample': ['Rescue sample', 'উদ্ধারের নমুনা'],
  'replies.submit': ['Submit reply', 'উত্তর পাঠান'],
  'phone.heading': ['Citizen phone', 'নাগরিকের ফোন'],
  'phone.detail': ['See the Bangla message a household receives and reply on its behalf.', 'পরিবারটি যে বাংলা বার্তা পায় তা দেখুন এবং তাদের পক্ষ থেকে উত্তর দিন।'],
  'phone.empty': ['Approve an alert to see a household’s phone.', 'কোনো পরিবারের ফোন দেখতে একটি সতর্কবার্তা অনুমোদন করুন।'],
  'phone.household': ['Household phone', 'পরিবারের ফোন'],
  'phone.view': ['Message view', 'বার্তার ধরন'],
  'phone.alert': ['Latest alert', 'সতর্কবার্তা'],
  'phone.voiceScript': ['Voice call', 'ফোনকল'],
  'phone.safe': ['১ · Safe', '১ · নিরাপদ'],
  'phone.help': ['২ · Help', '২ · সাহায্য চাই'],
  'phone.keySafe': ['১ নিরাপদ', '১ নিরাপদ'],
  'phone.keyHelp': ['২ সাহায্য', '২ সাহায্য'],
  'phone.callScreen': ['Call script', 'ফোনকলের বক্তব্য'],
  'phone.rescueSample': ['Send rescue sample', 'উদ্ধারের নমুনা পাঠান'],
  'phone.noMessage': ['There is no message for this household yet.', 'এই পরিবারের জন্য এখনো কোনো বার্তা নেই।'],
  'phone.replySent': ['Simulated reply sent.', 'মহড়ার উত্তর পাঠানো হয়েছে।'],
  'triage.heading': ['Rescue triage', 'উদ্ধারের অগ্রাধিকার'],
  'triage.detail': ['Cases for officer review during the simulation.', 'মহড়ায় কর্মকর্তার পর্যালোচনার জন্য উদ্ধার নথি।'],
  'case.empty': ['Requests for help and replies needing review appear here.', 'সাহায্যের আবেদন ও যাচাই দরকার এমন উত্তর এখানে দেখা যাবে।'],
  'case.groupUnknown': ['Group size unknown', 'কতজন আছেন জানা যায়নি'],
  'case.householdCount': ['{count} people in household', 'পরিবারে {count} জন'],
  'case.reportedCount': ['{count} people reported', 'উত্তরে {count} জনের কথা বলা হয়েছে'],
  'case.close': ['Close demo case', 'মহড়ার নথি বন্ধ করুন'],
  'case.noResponse': [
    'No reply to the alert or follow-up call. A ward volunteer was asked to check in person.',
    'সতর্কবার্তা বা খোঁজ নেওয়ার ফোনকলের উত্তর পাওয়া যায়নি। ওয়ার্ডের একজন স্বেচ্ছাসেবককে সরাসরি খোঁজ নিতে বলা হয়েছে।',
  ],
  'case.reportedSafe': ['Reported safe at {time}', '{time}-এ নিরাপদে থাকার কথা জানিয়েছেন'],
  'case.aiReview': ['Ask AI to review this simulated reply', 'মহড়ার এই উত্তরটি এআই দিয়ে পর্যালোচনা করুন'],
  'case.aiWorking': ['Reviewing the simulated reply…', 'মহড়ার উত্তরটি পর্যালোচনা করা হচ্ছে…'],
  'case.aiResult': ['AI review: {category}. {reason}', 'এআই পর্যালোচনা: {category}। {reason}'],
  'case.aiFallback': ['Rule-based result: {category}. The optional AI review is unavailable.', 'নিয়মভিত্তিক ফলাফল: {category}। ঐচ্ছিক এআই পর্যালোচনা এখন পাওয়া যাচ্ছে না।'],
  'case.aiConfirm': ['Send this fictional demo reply to OpenAI for an optional review?', 'মহড়ার এই কাল্পনিক উত্তরটি ঐচ্ছিক পর্যালোচনার জন্য ওপেনএআইয়ে পাঠাবেন?'],
  'messages.heading': ['Outbound messages', 'পাঠানো বার্তা'],
  'messages.detail': ['Bangla SMS, WhatsApp and voice-call previews.', 'বাংলা এসএমএস, হোয়াটসঅ্যাপ ও ফোনকলের নমুনা।'],
  'messages.empty': ['Simulated messages appear after an alert is approved.', 'সতর্কবার্তা অনুমোদনের পর মহড়ার বার্তাগুলো এখানে দেখা যাবে।'],
  'messages.playBangla': ['Play Bangla preview', 'বাংলা বক্তব্য শুনুন'],
  'messages.voiceUnavailable': ['Local Bangla voice unavailable', 'ডিভাইসে বাংলা কণ্ঠ নেই'],
  'messages.voiceFallback': ['This browser has no local Bangla voice. The call script is shown above.', 'এই ব্রাউজারে ডিভাইসের বাংলা কণ্ঠ পাওয়া যায়নি। কলের বক্তব্য ওপরে লেখা আছে।'],
  'feedback.advanced': ['Replay advanced to {time}.', 'মহড়া {time}-এ এগিয়েছে।'],
  'feedback.reset': ['Demo restarted.', 'মহড়া আবার শুরু হয়েছে।'],
  'feedback.reply': ['Simulated reply received.', 'মহড়ার উত্তর পাওয়া গেছে।'],
  'feedback.enterReply': ['Enter a reply.', 'একটি উত্তর লিখুন।'],
  'feedback.approved': ['Alert approved.', 'সতর্কবার্তা অনুমোদন করা হয়েছে।'],
  'feedback.rejected': ['Alert rejected.', 'সতর্কবার্তা বাতিল করা হয়েছে।'],
  'feedback.shelter': ['Shelter capacity updated.', 'আশ্রয়কেন্দ্রের খালি জায়গার তথ্য বদলানো হয়েছে।'],
  'feedback.closed': ['Simulated case closed.', 'মহড়ার নথি বন্ধ করা হয়েছে।'],

  'activity.heading': ['Agent timeline', 'এজেন্টদের কার্যক্রম'],
  'activity.detail': ['Agent actions and officer decisions with the reason for each.', 'এজেন্টদের কাজ ও কর্মকর্তার সিদ্ধান্তের পাশাপাশি প্রতিটির কারণ দেখুন।'],
  'activity.monitor': ['Read water levels and 24-hour rainfall for {count} areas to begin the risk check.', 'ঝুঁকি যাচাই শুরু করতে {count}টি এলাকার পানির উচ্চতা ও গত ২৪ ঘণ্টার বৃষ্টিপাতের তথ্য পড়া হয়েছে।'],
  'activity.riskAssessed': ['Checked {areaId} at {level} m. The score was {score} and risk was {severity}.', '{areaId} এলাকার পানির উচ্চতা {level} মিটার। ঝুঁকির স্কোর {score}, অবস্থা {severity}।'],
  'activity.alertRaised': ['Held {areaId}’s alert for approval because {level} m reached the {threshold} m demo threshold.', '{areaId} এলাকায় পানি {level} মিটার হয়ে মহড়ার {threshold} মিটার বিপৎসীমায় পৌঁছেছে। সতর্কবার্তা অনুমোদনের অপেক্ষায় আছে।'],
  'activity.alertReraised': ['Brought {areaId}’s alert back for review because the river gained {rise} m and reached {level} m.', 'পানি {rise} মিটার বেড়ে {level} মিটারে পৌঁছানোয় {areaId} এলাকার সতর্কবার্তা আবার পর্যালোচনার জন্য তোলা হয়েছে।'],
  'activity.alertApproved': ['Approved the severe alert for {areaId} so its messages could be queued.', '{areaId} এলাকার গুরুতর সতর্কবার্তা অনুমোদন করা হয়েছে, যাতে বার্তাগুলো পাঠানোর জন্য প্রস্তুত করা যায়।'],
  'activity.alertRejected': ['Rejected the alert for {areaId}. Delivery remains on hold.', '{areaId} এলাকার সতর্কবার্তা বাতিল করা হয়েছে। বার্তা পাঠানো স্থগিত আছে।'],
  'activity.shelterAssigned': ['Reserved space for {householdId} at {shelterId} because it had room.', 'জায়গা খালি থাকায় {householdId} পরিবারের জন্য {shelterId}-এ জায়গা বরাদ্দ করা হয়েছে।'],
  'activity.shelterRerouted': ['Routed {householdId} to {shelterId} to provide an available place.', 'খালি জায়গা পাওয়ায় {householdId} পরিবারকে {shelterId}-এ পাঠানো হয়েছে।'],
  'activity.shelterUnavailable': ['Could not assign a shelter because none had enough room for {householdId}.', 'কোনো আশ্রয়কেন্দ্রে পর্যাপ্ত জায়গা না থাকায় {householdId} পরিবারকে জায়গা দেওয়া যায়নি।'],
  'activity.shelterNoAlternate': ['No alternate shelter had enough room for {householdId}.', 'অন্য কোনো আশ্রয়কেন্দ্রে {householdId} পরিবারের জন্য পর্যাপ্ত জায়গা পাওয়া যায়নি।'],
  'activity.shelterFull': ['Marked {shelterId} full so no new households would be sent there.', '{shelterId} পূর্ণ দেখানো হয়েছে, যাতে সেখানে নতুন পরিবার পাঠানো না হয়।'],
  'activity.shelterAvailable': ['Reopened places at {shelterId} so households could be assigned there again.', '{shelterId}-এ আবার খালি জায়গা দেখানো হয়েছে, যাতে সেখানে নতুন করে পরিবার পাঠানো যায়।'],
  'activity.alertsQueued': ['Queued {count} Bangla messages for {areaId} after approval.', 'অনুমোদনের পর {areaId} এলাকার জন্য {count}টি বাংলা বার্তা পাঠানোর তালিকায় রাখা হয়েছে।'],
  'activity.replyClassified': ['Marked {householdId}’s reply as {category} to guide the officer’s next action.', 'কর্মকর্তার পরবর্তী পদক্ষেপ ঠিক করতে {householdId} পরিবারের উত্তরকে {category} হিসেবে চিহ্নিত করা হয়েছে।'],
  'activity.replyClosedCase': ['Closed the open case because {householdId} reported they were safe.', '{householdId} পরিবার নিরাপদে থাকার কথা জানানোয় তাদের চলমান নথি বন্ধ করা হয়েছে।'],
  'activity.caseClosed': ['The officer closed {householdId}’s simulated case.', 'কর্মকর্তা {householdId} পরিবারের মহড়ার নথিটি বন্ধ করেছেন।'],
  'activity.followUpQueued': ['Queued a Bangla follow-up call because {householdId} had not replied.', '{householdId} পরিবারের উত্তর না পাওয়ায় বাংলায় খোঁজ নেওয়ার একটি কল তালিকায় রাখা হয়েছে।'],
  'activity.escalated': ['Asked a ward volunteer to check on {householdId} after the follow-up went unanswered.', 'খোঁজ নেওয়ার কলেরও উত্তর না পাওয়ায় ওয়ার্ডের একজন স্বেচ্ছাসেবককে {householdId} পরিবারের খোঁজ নিতে বলা হয়েছে।'],

  'status.Normal': ['Normal', 'স্বাভাবিক'],
  'status.Watch': ['Watch', 'নজরদারিতে'],
  'status.Severe': ['Severe', 'গুরুতর'],
  'status.Pending': ['Pending', 'অপেক্ষায়'],
  'status.Approved': ['Approved', 'অনুমোদিত'],
  'status.Rejected': ['Rejected', 'বাতিল'],
  'status.Awaiting reply': ['Awaiting reply', 'উত্তরের অপেক্ষায়'],
  'status.Safe': ['Safe', 'নিরাপদ'],
  'status.Rescue': ['Rescue', 'উদ্ধার প্রয়োজন'],
  'status.Medical': ['Medical', 'চিকিৎসা প্রয়োজন'],
  'status.Help needed': ['Help needed', 'সাহায্য প্রয়োজন'],
  'status.Needs review': ['Needs review', 'যাচাই প্রয়োজন'],
  'status.No response': ['No response', 'উত্তর পাওয়া যায়নি'],
  'status.Closed': ['Closed', 'বন্ধ'],
  'area.sylhet': ['Sylhet', 'সিলেট'],
  'area.chattogram': ['Chattogram', 'চট্টগ্রাম'],
  'area.sunamganj': ['Sunamganj', 'সুনামগঞ্জ'],
  'riverName.Surma': ['Surma', 'সুরমা'],
  'riverName.Karnaphuli': ['Karnaphuli', 'কর্ণফুলী'],
  'riverName.Kushiyara': ['Kushiyara', 'কুশিয়ারা'],
  'household.rahima': ['Rahima', 'রহিমা'],
  'household.jamal': ['Jamal', 'জামাল'],
  'household.salma': ['Salma', 'সালমা'],
  'household.mina': ['Mina', 'মিনা'],
  'household.karim': ['Karim', 'করিম'],
  'shelter.school-a': ['Sylhet School Shelter', 'সিলেট স্কুল আশ্রয়কেন্দ্র'],
  'shelter.school-b': ['Sylhet Community Hall', 'সিলেট কমিউনিটি হল'],
  'shelter.school-c': ['Chattogram Civic Shelter', 'চট্টগ্রাম নাগরিক আশ্রয়কেন্দ্র'],
  'agent.Monitor': ['Monitor', 'পর্যবেক্ষক'],
  'agent.Risk Assessor': ['Risk Assessor', 'ঝুঁকি মূল্যায়নকারী'],
  'agent.Shelter Router': ['Shelter Router', 'আশ্রয় বরাদ্দকারী'],
  'agent.Bangla Communicator': ['Bangla Communicator', 'বাংলা বার্তা প্রেরক'],
  'agent.Rescue Triage': ['Rescue Triage', 'উদ্ধারের অগ্রাধিকার নির্ধারক'],
  'agent.Orchestrator': ['Orchestrator', 'সমন্বয়কারী'],
  'agent.Officer': ['Officer', 'কর্মকর্তা'],
  'channel.SMS': ['SMS', 'এসএমএস'],
  'channel.WhatsApp': ['WhatsApp', 'হোয়াটসঅ্যাপ'],
  'channel.Voice call': ['Voice call', 'ফোনকল'],
  'messageKind.Initial alert': ['Initial alert', 'প্রথম সতর্কবার্তা'],
  'messageKind.Reroute': ['Reroute', 'আশ্রয়কেন্দ্র পরিবর্তন'],
  'messageKind.Follow-up': ['Follow-up', 'খোঁজ নেওয়ার কল'],
  'timeline.monitor': ['Readings collected', 'পরিমাপ সংগ্রহ করা হয়েছে'],
  'timeline.riskAssessed': ['Area risk assessed', 'এলাকার ঝুঁকি মূল্যায়ন করা হয়েছে'],
  'timeline.alertRaised': ['Alert queued for approval', 'সতর্কবার্তা অনুমোদনের জন্য তোলা হয়েছে'],
  'timeline.alertReraised': ['Alert re-raised', 'সতর্কবার্তা আবার তোলা হয়েছে'],
  'timeline.alertApproved': ['Alert approved', 'সতর্কবার্তা অনুমোদিত'],
  'timeline.alertRejected': ['Alert rejected', 'সতর্কবার্তা বাতিল'],
  'timeline.shelterAssigned': ['Shelter assigned', 'আশ্রয়কেন্দ্র বরাদ্দ হয়েছে'],
  'timeline.shelterRerouted': ['Shelter changed', 'আশ্রয়কেন্দ্র বদলেছে'],
  'timeline.shelterUnavailable': ['Shelter unavailable', 'আশ্রয়কেন্দ্রে জায়গা নেই'],
  'timeline.shelterNoAlternate': ['No alternate shelter', 'বিকল্প আশ্রয়কেন্দ্র নেই'],
  'timeline.shelterFull': ['Shelter marked full', 'আশ্রয়কেন্দ্র পূর্ণ দেখানো হয়েছে'],
  'timeline.shelterAvailable': ['Shelter marked available', 'আশ্রয়কেন্দ্র খালি দেখানো হয়েছে'],
  'timeline.alertsQueued': ['Messages queued', 'বার্তা পাঠানোর জন্য প্রস্তুত'],
  'timeline.replyClassified': ['Reply classified', 'উত্তর যাচাই করা হয়েছে'],
  'timeline.replyClosedCase': ['Safe reply closed a case', 'নিরাপদ উত্তরে নথি বন্ধ হয়েছে'],
  'timeline.caseClosed': ['Case closed', 'নথি বন্ধ হয়েছে'],
  'timeline.followUpQueued': ['Follow-up call queued', 'খোঁজ নেওয়ার কল প্রস্তুত'],
  'timeline.escalated': ['Volunteer follow-up requested', 'স্বেচ্ছাসেবকের কাছে খোঁজ নেওয়ার অনুরোধ'],
};

export const translations = Object.freeze(Object.fromEntries(languages.map((language, index) => [
  language,
  Object.freeze(Object.fromEntries(Object.entries(strings).map(([key, pair]) => [key, pair[index].normalize('NFC')]))),
])));

export function t(language, key, params = {}) {
  const table = language === 'bn' ? translations.bn : translations.en;
  if (!Object.hasOwn(table, key)) return key;
  return table[key].replace(/\{(\w+)\}/g, (placeholder, name) => (
    Object.hasOwn(params, name) ? String(params[name]).normalize('NFC') : placeholder
  ));
}

export function readLanguage(storage) {
  try {
    return storage?.getItem(languageKey) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function writeLanguage(storage, language) {
  if (!languages.includes(language) || !storage) return false;
  try {
    storage.setItem(languageKey, language);
    return true;
  } catch {
    return false;
  }
}

export function formatNumber(language, value, options) {
  return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-GB', options).format(value);
}

export function formatTime(language, time) {
  return language === 'bn' ? time.replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]) : time;
}

const staticTargets = [
  ['data-i18n', 'textContent'],
  ['data-i18n-aria', 'aria-label'],
  ['data-i18n-placeholder', 'placeholder'],
  ['data-i18n-title', 'title'],
];

export function translateStatic(root, language) {
  const documentElement = root.documentElement;
  if (documentElement) documentElement.lang = language === 'bn' ? 'bn' : 'en';
  for (const [source, target] of staticTargets) {
    for (const node of root.querySelectorAll(`[${source}]`)) {
      const value = t(language, node.getAttribute(source));
      if (target === 'textContent') node.textContent = value;
      else node.setAttribute(target, value);
    }
  }
}
