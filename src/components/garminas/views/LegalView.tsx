"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNav } from "@/lib/store";

interface PolicyDef {
  slug: string;
  viewKey:
    | "legal-terms"
    | "legal-privacy"
    | "legal-community"
    | "legal-matrimonial"
    | "legal-conduct"
    | "legal-verification"
    | "legal-safety"
    | "legal-cookie"
    | "legal-retention"
    | "legal-deletion"
    | "legal-reporting";
  title: string;
  description: string;
  body: string[];
}

const POLICIES: PolicyDef[] = [
  {
    slug: "terms",
    viewKey: "legal-terms",
    title: "Terms of Service",
    description: "The terms that govern your use of GarMinas.",
    body: [
      "Welcome to GarMinas. By creating an account, accessing, or otherwise using the GarMinas platform, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must not access or use the platform. GarMinas is an exclusive matrimonial community for adult Ismailis connected to Gilgit-Baltistan, dedicated solely to serious matrimonial purposes.",
      "Eligibility. You must be at least eighteen (18) years of age to use GarMinas. By registering, you confirm that you are 18 or older, that you are part of the Ismaili community connected to Gilgit-Baltistan, and that you intend to use the platform only for serious matrimonial purposes. GarMinas is not a dating application and not a casual chat network. Members must not use the platform to solicit money, conduct scams, harass other members, or pursue commercial activity.",
      "Accounts. You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. GarMinas reserves the right to suspend or terminate accounts that violate these terms, that engage in fraudulent or abusive behaviour, or that fail verification.",
      "Verification. GarMinas employs multi-layered verification including email, phone, identity, community eligibility, and profile approval. Matchmaking features unlock only after a profile is approved by an administrator. Religious identity is never inferred from a member's name, location, profession, or photograph. Community verification is conducted discreetly through approved references by authorised reviewers.",
      "Member conduct. You agree not to misuse the platform. Prohibited conduct includes, without limitation: soliciting money from other members for any reason; pressuring members to move conversations off-platform before trust has been established; sharing sensitive documents (such as identity documents) through chat; impersonating another person; misrepresenting your identity, profession, or family; and any form of harassment or unwanted contact.",
      "Proposals. Proposals on GarMinas move through a structured lifecycle — Sent, Delivered, Viewed, Accepted or Declined, Introduction Requested, Family Discussion, and Closed. Both members retain control at every step. You may withdraw a proposal at any time and are never required to share a reason for declining. The decision to marry belongs to the two individuals considering it; family involvement, where present, is a source of wisdom rather than a substitute for honest, direct conversation.",
      "Intellectual property. GarMinas retains all rights in the platform, its design, branding, and underlying software. Member photographs and profile content remain the property of the member. GarMinas never uses member photographs for marketing or AI training without separate explicit consent, and never sells member information to third parties.",
      "Limitation of liability. GarMinas is provided on an 'as is' and 'as available' basis. To the maximum extent permitted by applicable law, GarMinas is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. GarMinas does not guarantee that introductions will result in marriage and does not conduct background checks beyond its stated verification process.",
      "Changes. GarMinas may update these terms from time to time. Material changes will be communicated to active members. Continued use of the platform after changes take effect constitutes acceptance of the updated terms.",
      "Governing law. These terms are intended to be reviewed for compliance with applicable Pakistani laws and the regulatory requirements relevant to a matrimonial service operating in or serving members in Pakistan. Disputes will be addressed in accordance with applicable law.",
    ],
  },
  {
    slug: "privacy",
    viewKey: "legal-privacy",
    title: "Privacy Policy",
    description: "How GarMinas collects, uses, and protects your information.",
    body: [
      "GarMinas takes your privacy seriously. This Privacy Policy explains what information we collect, why we collect it, how we use it, and the controls you have over your data. The policy is written in plain language because we believe members should understand, without legal training, how their information is handled.",
      "Information we collect. We collect the information you provide during registration — full name, date of birth, gender, email, mobile number, city, and your connection to Gilgit-Baltistan. We also collect profile information you choose to add, including education, profession, family background, photographs, and marriage preferences. We collect verification information, including identity document references and community eligibility references, as needed to complete verification. We collect technical information such as IP address and user agent when you sign in, for security and audit purposes.",
      "How we use information. We use your information to operate the platform — to verify your identity, to display your profile to other members according to your visibility settings, to facilitate proposals and conversations, and to notify you of activity on your account. We use audit logs to investigate security incidents and policy violations. We never sell your information to third parties. We never use your photographs for marketing or AI training without separate explicit consent.",
      "Verification and sensitive data. Identity documents submitted for verification are stored in access-controlled, private storage. They are reviewed only by authorised reviewers for the purpose of confirming identity. Religious identity is never inferred from a name, location, profession, or photograph. Community verification is conducted discreetly through approved references. Verification documents are retained only as long as necessary and are purged according to our retention policy.",
      "Your controls. You can adjust who sees your photographs and profile, whether you appear in search, whether your online status is visible, and whether family information is displayed. You can hide your profile temporarily or pause due to inactivity. You can request a complete export of the data we hold about you, deactivate your account, or permanently delete your account at any time through the Privacy Centre.",
      "Family representatives. If you invite a family representative, they receive only the specific permissions you grant — view your profile, send messages on your behalf, or request introductions. Family representatives never gain unrestricted access to private conversations, account credentials, or personal information.",
      "Notifications. Sensitive matrimonial details are masked in notification previews by default. Full details are visible only inside the application after you sign in. You can manage notification preferences within the platform.",
      "Data retention. We retain your information for as long as your account is active. When you deactivate, your profile is hidden but your data is retained. When you permanently delete your account, identifiable information is purged and your profile is anonymised. Some information may be retained in anonymised form for analytics or as required by law.",
      "Security. We employ industry-standard measures to protect your information, including hashed passwords, access controls, audit logging, and rate limiting. No method of transmission or storage is fully secure, but we work hard to protect your information.",
      "Children. GarMinas is strictly for adults aged 18 and older. We do not knowingly collect information from anyone under 18. If you believe a minor has registered, please contact us immediately.",
      "Changes. We may update this policy from time to time. Material changes will be communicated to active members. This policy must be reviewed for compliance with applicable Pakistani privacy laws before launch.",
    ],
  },
  {
    slug: "community",
    viewKey: "legal-community",
    title: "Community Standards",
    description: "The standards that every member is expected to uphold.",
    body: [
      "GarMinas is a community built on trust, respect, and serious matrimonial intention. These Community Standards describe the behaviour we expect of every member. By using GarMinas, you agree to uphold these standards.",
      "Respect and dignity. Treat every member with respect. Address members by name. Listen actively. Ask thoughtful questions about values, daily life, and family expectations. If a connection is not right, communicate your decision respectfully and withdraw the proposal through the proposal manager. You are never required to share a reason for declining, and you must never pressure another member for one.",
      "Honesty. Present yourself honestly in your profile. Avoid exaggeration. Do not misrepresent your identity, age, profession, education, family, or marital status. Avoid disclosing sensitive contact or location details in your profile text. GarMinas verifies members through multiple layers — dishonesty undermines the community for everyone.",
      "No solicitation. GarMinas must never be used to solicit money from other members for any reason. This includes requests for travel expenses, visa fees, medical emergencies, investments, loans, or gifts. If a member pressures you for money, cease communication immediately, decline or withdraw the proposal, and file a confidential report through the Safety Centre.",
      "No harassment. Unwanted contact, persistent messaging after a decline, threatening behaviour, or any form of harassment is strictly prohibited. Use the block and report tools whenever you feel uncomfortable. GarMinas investigates every report and may permanently ban members found to be engaging in harassment.",
      "Privacy of others. Do not share another member's photographs, messages, or personal information outside the platform. Do not attempt to identify or contact members who have not consented to be contacted. Do not infer religious identity about another member from their name, location, profession, or appearance.",
      "Family involvement. Where family is involved, it must be with the explicit consent of both individuals. Treat family involvement as a source of wisdom, not as a substitute for honest, direct conversation. Family representatives must operate within the permissions granted by the member who invited them.",
      "Verification cooperation. Members must cooperate honestly with verification. Submitting falsified documents, attempting to circumvent verification, or impersonating another person results in immediate account termination.",
      "Reporting. Members are encouraged to report any behaviour that violates these standards. Reports are confidential. We never reveal your identity to the member you report.",
      "Consequences. Violations of these standards may result in warnings, temporary suspension, or permanent banning. Serious violations — including fraud, harassment, or impersonation — result in immediate permanent banning and may be reported to relevant authorities.",
      "These standards must be reviewed for alignment with applicable Pakistani laws and community norms before launch.",
    ],
  },
  {
    slug: "matrimonial",
    viewKey: "legal-matrimonial",
    title: "Matrimonial-Only Usage Policy",
    description: "GarMinas is dedicated solely to matrimonial purposes.",
    body: [
      "GarMinas exists exclusively to support serious matrimonial introductions among adult Ismailis connected to Gilgit-Baltistan. By registering, every member confirms that they will use the platform solely for matrimonial purposes. This policy explains what that means in practice.",
      "What matrimonial use means. Matrimonial use means using GarMinas to find, evaluate, and connect with other members as serious candidates for marriage. It includes sending considered proposals, communicating respectfully with intent, involving family where appropriate, and pursuing introductions that may lead to marriage. It does not include casual dating, hookups, friendship-only connections, or commercial activity.",
      "What matrimonial use does not mean. GarMinas is not a dating application. Members must not use the platform to find casual romantic partners without serious intent, to solicit money, to conduct business, to recruit for any organisation, to promote products or services, or to chat idly without matrimonial intention. Members must not use the platform to contact others who have declined proposals or revoked consent.",
      "Member declaration. At registration, every member confirms that they will use GarMinas solely for serious matrimonial purposes and not for casual dating, solicitation, or commercial activity. This declaration is recorded as a consent and forms part of the member's agreement with GarMinas.",
      "Profile expectations. Profiles must reflect genuine matrimonial intent. About Me sections should describe who you are today, your values, and what you hope to build with a future spouse. Photographs should be clear, recent, and presented with dignity. GarMinas administrators review profiles and photographs before approval and may decline approval where content is inconsistent with matrimonial intent.",
      "Proposal expectations. Proposals must be sent with serious intent. Members should not send proposals indiscriminately — GarMinas limits outstanding proposals to prevent mass-messaging. Each proposal should be considered: read the recipient's profile, reflect on compatibility, and write a respectful message where appropriate. Withdraw proposals promptly if you decide the connection is not right.",
      "Family involvement. In our community, marriage is often a family decision as much as an individual one. GarMinas supports optional, controlled family involvement through trusted representatives. Family involvement is encouraged where it supports the two individuals considering marriage, but the decision to marry belongs to the two individuals alone.",
      "Prohibited behaviours. The following behaviours violate this policy: using GarMinas for any non-matrimonial purpose; sending proposals to members with whom you have no serious matrimonial interest; pressuring members for off-platform contact before trust is established; soliciting money for any reason; and any conduct intended to deceive or manipulate another member.",
      "Enforcement. Members found using GarMinas for non-matrimonial purposes may have their accounts suspended or terminated. Repeated or serious violations result in permanent banning.",
      "This policy must be reviewed for compliance with applicable Pakistani laws governing matrimonial services and family law before launch.",
    ],
  },
  {
    slug: "conduct",
    viewKey: "legal-conduct",
    title: "Member Conduct Policy",
    description: "Detailed rules for respectful behaviour on the platform.",
    body: [
      "This Conduct Policy sets out the detailed rules that govern member behaviour on GarMinas. It complements, but does not replace, our Community Standards. All members are expected to read and follow this policy.",
      "Communication. All communication on GarMinas must be respectful and dignified. Address other members by name. Avoid pressing for personal contact information — residential address, financial details, or copies of identity documents — through chat, especially before an introduction has been mutually agreed. Listen actively. Ask thoughtful questions about values, daily life, and family expectations.",
      "Honesty and authenticity. You must present yourself honestly. Misrepresenting your identity, age, profession, education, family, marital status, or any other material fact is strictly prohibited. GarMinas verifies members through multiple layers; dishonesty at any layer results in account termination.",
      "Privacy and confidentiality. You must not share another member's photographs, messages, or personal information outside the platform. You must not screenshot or save another member's photographs without their consent. You must not attempt to identify members who have chosen to hide their profiles or appear only after introduction.",
      "No financial requests. Soliciting money from other members for any reason — including travel, visas, medical emergencies, investments, loans, or gifts — is strictly prohibited and results in immediate permanent banning. If you encounter a request for money, file a confidential report immediately.",
      "No off-platform pressure. Pressuring members to move conversations to encrypted messaging apps or other off-platform channels before trust has been established is prohibited, particularly where the pressure appears designed to evade GarMinas's moderation. Always be cautious of members who insist on moving off-platform quickly.",
      "No harassment. Unwanted contact, persistent messaging after a decline, threatening behaviour, derogatory language, or any form of harassment is prohibited. Use the block and report tools whenever you feel uncomfortable.",
      "No impersonation. Impersonating another person — living or deceased — is strictly prohibited and results in immediate permanent banning. This includes using another person's photographs, name, or biographical details without consent.",
      "No solicitation of sensitive documents. You must not request copies of identity documents, financial documents, or other sensitive materials through chat. Verification documents are submitted only through GarMinas's secure verification process.",
      "Reporting and cooperation. Members are required to cooperate with GarMinas investigations. Knowingly filing false reports is itself a violation. Retaliating against a member who has filed a report against you is prohibited.",
      "Consequences. Violations of this Conduct Policy may result in warnings, temporary suspension, or permanent banning. Serious violations — including fraud, harassment, impersonation, or solicitation of money — result in immediate permanent banning.",
      "This policy must be reviewed for compliance with applicable Pakistani laws, including those governing online conduct and harassment, before launch.",
    ],
  },
  {
    slug: "verification",
    viewKey: "legal-verification",
    title: "Verification Policy",
    description: "How GarMinas verifies members and what we expect.",
    body: [
      "Verification is the foundation of trust on GarMinas. This policy explains how verification works, what we verify, what we do not verify, and what we expect of members.",
      "The five layers. GarMinas employs five layers of verification: email, phone, identity, community eligibility, and profile approval. Each layer is independent. Matchmaking unlocks only after a profile is approved by an administrator.",
      "Email verification. Members verify ownership of their email address by clicking a verification link sent to that address. In production, the link is sent only by email and is never returned to the client. In the sandbox, the link token is returned to the developer for testing.",
      "Phone verification. Members verify their mobile number by entering a one-time password (OTP) sent to that number. In production, the OTP is sent only by SMS and is never returned to the client. In the sandbox, the OTP is returned to the developer for testing. OTPs expire after 10 minutes.",
      "Identity verification. Members submit identity documentation (such as a government-issued identity document) to private, access-controlled storage. An authorised reviewer reviews the submission discreetly and confirms or declines identity verification. Identity documents are never displayed to other members and are never used for any purpose other than verification.",
      "Community verification. Community eligibility is verified discreetly through approved references by an authorised reviewer. Religious identity is never inferred from a member's name, location, profession, or photograph. Members must consent to community verification before it proceeds. Without consent, community verification is not conducted.",
      "Profile approval. After email, phone, identity, and community verifications are complete, an administrator reviews the member's profile and photographs. Approval considers authenticity, dignity, and matrimonial intent. Photographs must be clear, recent, and presented with respect. Profile text must reflect genuine matrimonial intent.",
      "Reviewer authority. Reviewers are authorised by GarMinas administrators. Reviewers must conduct verification discreetly, respectfully, and without bias. Reviewer decisions are recorded with reviewer identity and timestamp for audit.",
      "Member obligations. Members must cooperate honestly with verification. Submitting falsified documents, attempting to circumvent verification, impersonating another person, or providing false references results in immediate account termination.",
      "Re-verification. GarMinas may require re-verification in response to suspected policy violations, reports, or material changes to a member's profile. Members may also request re-verification if they believe their verification status is incorrect.",
      "Privacy. Verification data is stored separately from profile data. Identity documents are not displayed to other members. Community references are not shared with the member being verified beyond confirming that verification was conducted.",
      "This policy must be reviewed for compliance with applicable Pakistani laws governing identity verification, data protection, and anti-money-laundering requirements before launch.",
    ],
  },
  {
    slug: "safety",
    viewKey: "legal-safety",
    title: "Safety Policy",
    description: "How GarMinas protects members and what to do when something feels wrong.",
    body: [
      "Your safety is our priority. This Safety Policy explains how GarMinas protects members, the tools available to you, and what to do when something feels wrong.",
      "Multi-layered verification. Every active member has completed email, phone, identity, community, and profile verification. This does not guarantee that a member is trustworthy, but it significantly reduces the risk of fake or impersonating accounts. Always exercise your own judgement.",
      "Matrimonial fraud. Matrimonial fraud is a real and serious threat. Be cautious of any member who: requests money for any reason, including travel, visas, medical emergencies, or investments; pressures you to move the conversation off-platform to encrypted messaging apps before trust is built; claims a sudden emergency requiring your financial help; sends inconsistent information about their identity, profession, or family; or refuses to verify their identity or community eligibility.",
      "If you encounter fraud. Cease communication immediately. Decline or withdraw any active proposal. Block the member. File a confidential report through the Safety Centre. GarMinas investigates every report and may permanently ban members found to be engaging in fraud.",
      "Blocking. You can block any member at any time. Blocked members cannot view your profile, send you proposals, or message you. You can unblock members through the Safety Centre.",
      "Reporting. Use the confidential report form in the Safety Centre to report fake profiles, impersonation, harassment, inappropriate behaviour, fraud or financial requests, misrepresentation, suspicious accounts, or unwanted contact. Reports are reviewed discreetly by our moderation team. We never reveal your identity to the member you report.",
      "Privacy protections. Sensitive matrimonial details are masked in notification previews by default. You control who can see your photographs and profile, whether you appear in search, and whether your family information is displayed. You can hide your profile temporarily or pause due to inactivity at any time.",
      "Family involvement. Optional, controlled family involvement is supported through trusted representatives with limited permissions. Family representatives can help gather information, ask practical questions, and share perspectives. They never gain unrestricted access to private conversations or account credentials.",
      "Emergency. If you are in immediate danger, contact local emergency services. GarMinas is not an emergency service. Our moderation team responds to reports as quickly as possible, but we cannot provide emergency response.",
      "Education. The GarMinas guidance library includes articles on privacy and online safety, recognising matrimonial fraud, and respectful communication. Members are encouraged to read these articles.",
      "Children. GarMinas is strictly for adults. We do not knowingly allow anyone under 18 to register. If you encounter an account you believe belongs to a minor, report it immediately.",
      "This policy must be reviewed for compliance with applicable Pakistani laws, including those governing online safety, fraud, and harassment, before launch.",
    ],
  },
  {
    slug: "cookie",
    viewKey: "legal-cookie",
    title: "Cookie Policy",
    description: "How GarMinas uses cookies and similar technologies.",
    body: [
      "This Cookie Policy explains how GarMinas uses cookies and similar technologies to operate the platform. We use the minimum necessary to provide a secure, functional experience.",
      "What are cookies. Cookies are small text files stored on your device when you visit a website. They allow the website to remember your actions and preferences over time. GarMinas uses only essential cookies.",
      "Session cookies. GarMinas uses a session cookie to keep you signed in. This cookie contains a securely-generated session token that allows us to identify your session without exposing your password. The cookie is httpOnly (not accessible to JavaScript), secure in production, and SameSite=Lax to protect against cross-site request forgery.",
      "Session duration. Sessions last for seven days from sign-in. After seven days, you will be asked to sign in again. You can end all sessions at any time through the Privacy Centre.",
      "No tracking cookies. GarMinas does not use third-party tracking cookies. We do not use advertising networks that track you across other websites. We do not use analytics cookies that profile your behaviour across the web.",
      "Local storage. GarMinas may use browser local storage to remember user interface preferences (such as theme or recently viewed articles). This data is stored on your device and is not transmitted to us.",
      "Your choices. Because we use only essential cookies, you do not need to disable cookies to use GarMinas securely. If you prefer not to have any cookies stored, you can sign out and clear your browser's cookies. Note that without the session cookie, you will need to sign in again for each page.",
      "Third-party services. GarMinas does not embed third-party trackers. If we ever add a third-party service that uses cookies, we will update this policy and seek your consent where required.",
      "Updates. We may update this policy if our use of cookies changes. Material changes will be communicated to active members.",
      "This policy must be reviewed for compliance with applicable Pakistani data protection laws and any relevant electronic transaction regulations before launch.",
    ],
  },
  {
    slug: "retention",
    viewKey: "legal-retention",
    title: "Data Retention Policy",
    description: "How long GarMinas keeps different types of information.",
    body: [
      "This Data Retention Policy explains how long GarMinas retains different types of information. We retain information only as long as necessary for the purposes described in our Privacy Policy, or as required by applicable law.",
      "Active accounts. We retain your information for as long as your account is active. An account is considered active if you have signed in within the past twelve months. If you sign in less frequently but remain a member, your account remains active but you may be marked as inactive.",
      "Deactivated accounts. When you deactivate your account, your profile is hidden from other members and you are marked as inactive. Your data is retained. You can reactivate at any time by signing in. Deactivated accounts that remain deactivated for twenty-four months may be reviewed for permanent deletion.",
      "Deleted accounts. When you permanently delete your account, identifiable information — including your name, email, phone, photographs, and profile text — is purged. Your user record is anonymised. Some information may be retained in anonymised form for analytics or as required by law.",
      "Verification documents. Identity documents submitted for verification are retained only as long as necessary to support verification and dispute resolution. In production, verification documents are purged on a defined schedule after verification is complete, unless retention is required by law. References for community verification are not retained beyond the verification decision.",
      "Audit logs. Audit logs are retained for a defined period to support security investigations, fraud detection, and regulatory compliance. After this period, audit logs are automatically purged.",
      "Notifications. Notifications are retained for a defined period and then automatically purged. You can delete individual notifications through the notification centre.",
      "Proposals and messages. Proposals and messages are retained for as long as your account is active. When you permanently delete your account, your proposals and messages are anonymised — your identity is removed but the message text may be retained to preserve conversation integrity for the other party.",
      "Reports. Reports filed through the Safety Centre are retained for a defined period after resolution, to support pattern detection and appeals. After this period, reports are purged.",
      "Backups. GarMinas maintains backups for disaster recovery. Backups are retained on a defined rotation and are subject to the same retention rules as live data.",
      "Legal hold. Where required by law or where GarMinas reasonably believes that information is relevant to an investigation or legal proceeding, retention may be extended beyond the normal periods.",
      "This policy must be reviewed for compliance with applicable Pakistani data retention laws, including any sector-specific requirements, before launch.",
    ],
  },
  {
    slug: "deletion",
    viewKey: "legal-deletion",
    title: "Account Deletion Policy",
    description: "How to permanently delete your account and what happens next.",
    body: [
      "You have the right to permanently delete your GarMinas account at any time. This Account Deletion Policy explains how deletion works and what happens to your information.",
      "How to delete your account. To permanently delete your account, visit the Privacy Centre and select 'Permanently delete account'. For your safety, you will be asked to confirm by typing the word DELETE. This double-confirmation prevents accidental deletion.",
      "What deletion means. When you permanently delete your account, GarMinas purges identifiable information associated with your account. Your email is replaced with a deleted marker, your phone number is removed, your password hash and salt are replaced with deletion markers, and your email verification token and phone OTP are removed.",
      "Profile anonymisation. Your profile's full name is replaced with '[Deleted member]'. Your About Me text, photographs, and primary photo are removed. Your photo visibility and profile visibility are set to HIDDEN. You no longer appear in search results.",
      "Proposals and messages. Proposals you sent or received remain visible to the other party, but your identity is anonymised. Message text you sent remains visible in conversations, but your sender identity is anonymised. This preserves conversation integrity for the other party while protecting your privacy.",
      "Verification documents. Identity documents submitted for verification are purged in accordance with our Data Retention Policy. References for community verification are not retained beyond the verification decision.",
      "Family representatives. Any family representatives you have invited are revoked. Their access to your profile ends immediately.",
      "Sessions. All active sessions for your account are terminated. You will be signed out of every device.",
      "Audit logs. Audit logs recording your account activity (such as sign-ins and verification events) are retained in anonymised form for security and fraud-detection purposes, in accordance with our Data Retention Policy.",
      "Recovery. Permanent deletion is irreversible. You cannot recover your account or its data after deletion. If you change your mind, you will need to register a new account and complete verification from scratch.",
      "Deactivation alternative. If you are unsure about permanent deletion, consider deactivating instead. Deactivation hides your profile and marks you as inactive, but retains your data. You can reactivate at any time by signing in, and you can return to permanently delete your account later.",
      "Timing. Permanent deletion takes effect immediately. Purging of associated data (such as verification documents and backups) follows the schedule in our Data Retention Policy.",
      "This policy must be reviewed for compliance with applicable Pakistani data protection laws, including the right to erasure, before launch.",
    ],
  },
  {
    slug: "reporting",
    viewKey: "legal-reporting",
    title: "Reporting & Moderation Policy",
    description: "How GarMinas handles reports and moderates the community.",
    body: [
      "This Reporting & Moderation Policy explains how to file a report, what happens after you file one, and how GarMinas moderates the community.",
      "When to report. You should file a confidential report whenever you encounter behaviour that violates our Community Standards, Member Conduct Policy, or Matrimonial-Only Usage Policy. This includes fake profiles, impersonation, harassment, inappropriate behaviour, fraud or financial requests, misrepresentation, suspicious accounts, and unwanted contact.",
      "How to report. Use the confidential report form in the Safety Centre. Provide the user ID of the member you are reporting, the reason for the report, and any additional context that helps our team investigate. Do not include sensitive personal information in the report details.",
      "Confidentiality. Reports are confidential. We never reveal your identity to the member you report. Reports are reviewed only by authorised moderation team members.",
      "What happens after you report. Our moderation team reviews every report discreetly. We may contact you for additional information if needed. We may take action including warnings, temporary suspension, or permanent banning. We do not always share the specific outcome of a report with the reporter, but every report is investigated.",
      "Reporting to authorities. For criminal behaviour — including serious fraud, threats, or harassment that may constitute a criminal offence — GarMinas may report the matter to relevant authorities. Where we do so, we may share information as required by law.",
      "False reports. Knowingly filing false reports is itself a violation of our policies. Members found to be filing false reports to harass others may face warnings, suspension, or banning.",
      "Retaliation. Retaliating against a member who has filed a report against you is strictly prohibited. If you believe a report was filed against you unfairly, you may respond through the support ticket system; you must not contact the reporter directly.",
      "Appeals. If your account is suspended or banned, you may appeal through the support ticket system. Appeals are reviewed by a different moderator than the one who made the original decision.",
      "Blocks. Blocking a member is separate from reporting. Blocks immediately prevent further contact; reports trigger investigation. You can block without reporting, and you can report without blocking.",
      "Moderation authority. GarMinas administrators have sole authority to suspend or ban accounts. Moderators review reports and make recommendations; administrators make final decisions on serious cases.",
      "Transparency. We publish aggregate, anonymised statistics about moderation activity (such as number of reports filed and number of accounts banned) to help the community understand how moderation works. We never publish information that could identify individual members.",
      "This policy must be reviewed for compliance with applicable Pakistani laws, including those governing online platforms and content moderation, before launch.",
    ],
  },
];

export default function LegalView() {
  const legalView = useNav((s) => s.legalView);
  const openLegal = useNav((s) => s.openLegal);

  const activeSlug = useMemo(() => {
    if (legalView && POLICIES.some((p) => p.slug === legalView)) return legalView;
    return "terms";
  }, [legalView]);

  const active = useMemo(
    () => POLICIES.find((p) => p.slug === activeSlug) ?? POLICIES[0],
    [activeSlug]
  );

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <Scale className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Legal
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Policies & legal documents
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Please review the policies that govern your use of GarMinas.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux h-fit lg:sticky lg:top-4">
            <div className="p-3">
              <p className="px-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#D6B77A]" /> All policies
              </p>
              <ScrollArea className="h-auto max-h-[60vh]">
                <ul className="space-y-0.5">
                  {POLICIES.map((p) => {
                    const isActive = p.slug === active.slug;
                    return (
                      <li key={p.slug}>
                        <button
                          onClick={() => openLegal(p.slug)}
                          className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                            isActive
                              ? "bg-[#D6B77A]/15 text-foreground font-medium"
                              : "text-muted-foreground hover:bg-[#F3EEE2]"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-[#D6B77A]" />
                            <span className="truncate">{p.title}</span>
                          </span>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-[#D6B77A] shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </div>
          </Card>

          {/* Content */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
            <CardContent className="p-6 md:p-10">
              <motion.div
                key={active.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
                  Policy
                </p>
                <h2 className="font-serif text-3xl text-foreground mb-2">
                  {active.title}
                </h2>
                <p className="text-muted-foreground mb-6">{active.description}</p>
                <Separator className="bg-[#D6B77A]/20 mb-6" />
                <article className="space-y-4">
                  {active.body.map((para, i) => (
                    <p key={i} className="text-sm md:text-base text-foreground/85 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </article>
                <Separator className="bg-[#D6B77A]/20 my-6" />
                <div className="rounded-md border border-[#C88F91]/30 bg-[#C88F91]/5 p-4 text-xs text-muted-foreground flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#C88F91] shrink-0 mt-0.5" />
                  <span>
                    These policies must be reviewed for applicable Pakistani laws
                    and privacy requirements before launch.
                  </span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
