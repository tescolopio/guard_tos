const mockAnalysisData = {
  "Example A+": {
    name: "Exemplary Service Terms (Theoretical)",
    url: "https://example.com/exemplary",
    grade: "A+",
    rights: { score: 98, grade: "A+", confidence: 0.95 },
    readability: { grade: "B", flesch: 72, kincaid: 7.2 },
    risk: "low",
    enhancedData: {
      keyFindings: [
        "You retain full ownership of your content.",
        "Terms are written in plain, easy-to-understand language.",
        "The company will notify you of any changes to the terms and provide a summary.",
        "Data is not sold or shared with third-party marketers.",
        "Clear and simple process for account deletion and data removal.",
      ],
    },
    topCategories: ["USER_RIGHTS:100", "TRANSPARENCY:98", "FAIR_PRACTICES:97"],
    terms: [
      { word: "rights", count: 45 },
      { word: "user", count: 42 },
      { word: "protection", count: 38 },
      { word: "transparent", count: 35 },
      { word: "fair", count: 30 },
    ],
  },
  "Example A": {
    name: "Excellent Service Agreement",
    url: "https://example.com/excellent",
    grade: "A",
    rights: { score: 92, grade: "A", confidence: 0.89 },
    readability: { grade: "C", flesch: 68, kincaid: 8.1 },
    risk: "low",
    enhancedData: {
      keyFindings: [
        "You grant a limited license only for operating the service.",
        "Opt-out of arbitration is available for 30 days.",
        "The company provides 14-day notice for significant changes.",
        "Data sharing with partners is for operational purposes only.",
      ],
    },
    topCategories: ["USER_RIGHTS:95", "TRANSPARENCY:92", "PRIVACY:94"],
    terms: [
      { word: "privacy", count: 52 },
      { word: "rights", count: 48 },
      { word: "user", count: 44 },
      { word: "consent", count: 38 },
      { word: "control", count: 33 },
    ],
  },
  "Example B": {
    name: "Standard Service Terms",
    url: "https://example.com/standard",
    grade: "B",
    rights: { score: 82, grade: "B", confidence: 0.78 },
    readability: { grade: "D", flesch: 58, kincaid: 9.9 },
    risk: "low",
    enhancedData: {
      keyFindings: [
        "Binding arbitration is the default for disputes, but small claims court is an option.",
        "The company may use your content to improve its services.",
        "Terms can be updated with notice posted on the service.",
        "Some anonymized data may be shared with analytics partners.",
      ],
    },
    topCategories: ["CONTENT_AND_IP:85", "DISPUTE_RESOLUTION:88", "PRIVACY:80"],
    terms: [
      { word: "service", count: 60 },
      { word: "user", count: 55 },
      { word: "data", count: 48 },
      { word: "content", count: 42 },
      { word: "notice", count: 35 },
    ],
  },
  "Example C": {
    name: "Acceptable Service Agreement",
    url: "https://example.com/acceptable",
    grade: "C",
    rights: { score: 72, grade: "C", confidence: 0.65 },
    readability: { grade: "F", flesch: 53, kincaid: 10.8 },
    risk: "medium",
    enhancedData: {
      keyFindings: [
        "You waive your right to a jury trial by agreeing to arbitration.",
        "The company can terminate your account for a broad range of reasons.",
        "Liability is significantly limited, even for service failures.",
        "Your content license is broad and continues even if you delete your account (for cached content).",
      ],
    },
    topCategories: ["CONTENT_AND_IP:78", "LIABILITY_AND_REMEDIES:80", "DISPUTE_RESOLUTION:82"],
    terms: [
      { word: "terms", count: 82 },
      { word: "liability", count: 46 },
      { word: "service", count: 44 },
      { word: "content", count: 39 },
      { word: "warranty", count: 35 },
    ],
  },
  "Example D": {
    name: "Concerning Service Terms",
    url: "https://example.com/concerning",
    grade: "D",
    rights: { score: 62, grade: "D", confidence: 0.62 },
    readability: { grade: "F", flesch: 42, kincaid: 13.5 },
    risk: "high",
    enhancedData: {
      keyFindings: [
        "You must indemnify the company against almost all claims related to your use of the service.",
        "The company can change terms at any time without direct notification.",
        "Class action waiver is mandatory and has no opt-out.",
        "The company's liability is limited to the amount you paid in the last 3 months, or $50.",
      ],
    },
    topCategories: ["LIABILITY_AND_REMEDIES:62", "UNILATERAL_CHANGES:65", "DISPUTE_RESOLUTION:68"],
    terms: [
      { word: "liability", count: 78 },
      { word: "waive", count: 54 },
      { word: "indemnify", count: 49 },
      { word: "damages", count: 45 },
      { word: "arbitration", count: 41 },
    ],
  },
  "Example F": {
    name: "Problematic User Agreement",
    url: "https://example.com/problematic",
    grade: "F",
    rights: { score: 48, grade: "F", confidence: 0.71 },
    readability: { grade: "F", flesch: 35, kincaid: 15.2 },
    risk: "high",
    enhancedData: {
      keyFindings: [
        {
          title: "You Give Away Ownership of Your Content and Ideas",
          whatItSays: "Anything you create or upload — like maps, photos, or even new techniques — becomes the company’s property forever. You give up the right to be credited or control how it’s used.",
          inPlainTerms: "“If you make something using our app, we own it. You won’t get credit or control.”"
        },
        {
          title: "You Consent to Extensive and Perpetual Data Collection",
          whatItSays: "The company will always collect and use your personal data — including your exact location, stress levels, and physical performance — and can sell or analyze it however they want. You give up your right to privacy.",
          inPlainTerms: "“We’ll track your location and body data forever, and you can’t stop us or expect privacy.”"
        },
        {
          title: "The Corporation Has Almost No Liability",
          whatItSays: "The app is provided “as is.” If it breaks, gives bad info, or fails in an emergency, the company isn’t responsible. If you sue, the most you can get is $100 or what you paid in the last 6 months.",
          inPlainTerms: "“If our app fails or causes harm, we’re not responsible — and you’ll get little or no money.”"
        },
        {
          title: "You Waive Your Right to Sue in Court",
          whatItSays: "You agree to settle all disputes through private arbitration in Delaware. You give up your right to a jury trial or joining a class-action lawsuit.",
          inPlainTerms: "“You can’t take us to court or join others in suing us — only private arbitration is allowed.”"
        },
        {
          title: "Subscriptions Automatically Renew with No Refunds",
          whatItSays: "If you subscribe, it will auto-renew at full price unless you cancel at least 72 hours before. You won’t get a refund for unused time.",
          inPlainTerms: "“Your subscription renews automatically. Cancel early — and don’t expect refunds.”"
        }
      ]
    },
    sections: [
        {
            "userFriendlyHeading": "SECTION 1. PREAMBLE AND BINDING ACCEPTANCE OF AGREEMENT",
            "riskLevel": "medium",
            "keyPoints": [
                "This agreement is a legally binding contract between you and Hunt Master Technologies Corporation.",
                "You agree to all terms simply by downloading, installing, creating an account, or clicking \"I Agree.\"",
                "If you don't agree with every single term, you are forbidden from using the service and must delete it immediately."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 2. COMPREHENSIVE DESCRIPTION OF THE SERVICE ECOSYSTEM",
            "riskLevel": "medium",
            "keyPoints": [
                "The app is a complex \"ecosystem\" that relies on collecting and analyzing large amounts of your data.",
                "This data includes your content, location, biometrics (e.g., heart rate, stability), and sensory data (e.g., audio recordings).",
                "The app uses this collective user data to power its core features and predictive models."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 3. GRANT OF A LIMITED, REVOCABLE, NON-TRANSFERABLE LICENSE",
            "riskLevel": "medium",
            "keyPoints": [
                "You are not buying the software; you are being granted a limited license to use it.",
                "The Corporation owns all rights to the software and its intellectual property.",
                "This license can be revoked by the Corporation at any time, for any reason, without notice."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 4. PROHIBITED USES AND CODE OF CONDUCT",
            "riskLevel": "low",
            "keyPoints": [
                "You are forbidden from reverse-engineering, modifying, or creating derivative works from the app.",
                "You cannot use the app for any commercial purpose or to create a competing product.",
                "You are prohibited from using automated systems (\"bots,\" \"spiders\") to access the service."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 5. ACCOUNT REGISTRATION, SECURITY, AND USER OBLIGATIONS",
            "riskLevel": "low",
            "keyPoints": [
                "You must provide truthful and accurate information during registration.",
                "You are 100% responsible for keeping your password secret and for all activities that happen on your account.",
                "You can be held liable for losses the Corporation or others incur if someone else uses your account."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 6. USER-GENERATED CONTENT (UGC) SUBMISSIONS",
            "riskLevel": "medium",
            "keyPoints": [
                "You are solely responsible for all content you upload (photos, notes, locations, etc.).",
                "You must either own the content you upload or have all necessary rights and permissions to grant it to the Corporation.",
                "The Corporation is not required to back up your content, and it can be deleted at any time without warning."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 7. CESSION OF INTELLECTUAL PROPERTY AND PERPETUAL, IRREVOCABLE LICENSE GRANT",
            "riskLevel": "high",
            "keyPoints": [
                "You permanently and irrevocably give the Corporation complete ownership of all content (UGC) you create or upload.",
                "This includes any new hunting techniques, game call patterns, or ideas you develop while using the app.",
                "This transfer of your intellectual property is worldwide, royalty-free, and survives even after you stop using the app.",
                "You waive all \"moral rights,\" meaning you give up the right to be credited for your content or ideas."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 8. CONSENT TO BIOMETRIC, PHYSIOLOGICAL, AND SENSORY DATA COLLECTION",
            "riskLevel": "high",
            "keyPoints": [
                "You give explicit consent for the app to perpetually collect, store, and commercialize your biometric and sensory data.",
                "The Corporation can use this data for any purpose, including selling aggregated data products to third parties, without compensating you."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 9. CONSENT TO GEOLOCATION, ENVIRONMENTAL, AND POSITIONAL DATA PROCESSING",
            "riskLevel": "high",
            "keyPoints": [
                "You agree to the continuous and perpetual collection of your precise location data.",
                "You explicitly waive any and all expectation of privacy regarding your geographic location and movements.",
                "The Corporation has the unrestricted right to sell or license this location data to third parties."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 10. THIRD-PARTY HARDWARE & SERVICE INTEGRATIONS",
            "riskLevel": "medium",
            "keyPoints": [
                "The Corporation is not responsible for any third-party hardware (like sensors or cameras) or services (like weather APIs) you connect to the app.",
                "Any data sent from third-party devices into the app becomes subject to the same terms, including the intellectual property giveaway in Section 7."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 11. SOCIAL, COMMUNITY, AND RECOVERY NETWORK PROVISIONS",
            "riskLevel": "medium",
            "keyPoints": [
                "You use community features (like mentor connections) at your own sole risk.",
                "The Corporation does not vet other users and is not responsible for any disputes or damages arising from your interactions with them."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 12. SAFETY FEATURES, EMERGENCY SERVICES, AND EXPRESS ASSUMPTION OF RISK",
            "riskLevel": "high",
            "keyPoints": [
                "Any safety features (like emergency alerts) are not guaranteed to work and are not a substitute for 911.",
                "You use these features at your own risk and assume all risks associated with outdoor activities, including injury and death.",
                "The Corporation has no liability if a safety feature fails."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 13. PROVISIONS FOR PROFESSIONAL, GUIDE, AND COMMERCIAL USE",
            "riskLevel": "high",
            "keyPoints": [
                "If you use the app for commercial purposes (e.g., as a hunting guide), any client or business data you enter is also considered UGC.",
                "This means you are assigning ownership of your client and business data to the Corporation."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 14. SUBSCRIPTION FEES, PAYMENT TERMS, AND AUTO-RENEWAL CLAUSES",
            "riskLevel": "high",
            "keyPoints": [
                "Subscriptions will automatically renew at the current non-promotional price.",
                "You must cancel at least 72 hours before your term expires to avoid being charged for the next period.",
                "There are no refunds for partial subscription periods."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 15. TERM AND TERMINATION",
            "riskLevel": "medium",
            "keyPoints": [
                "The Corporation can terminate or deny your access to the service at any time, for any reason, without notice or liability.",
                "Key parts of the agreement, like the company's ownership of your content and the limitation of liability, continue even after your account is terminated."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 16. MODIFICATION, INTERRUPTION, AND DISCONTINUATION OF SERVICE",
            "riskLevel": "medium",
            "keyPoints": [
                "The Corporation can change, suspend, or permanently shut down the service at any time without notice or liability to you."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 17. DISCLAIMER OF ALL WARRANTIES",
            "riskLevel": "high",
            "keyPoints": [
                "The app is provided \"AS IS\" and \"AS AVAILABLE.\"",
                "The Corporation makes no promise that the service will work, meet your needs, be reliable, or be error-free."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 18. LIMITATION OF LIABILITY AND WAIVER OF DAMAGES",
            "riskLevel": "high",
            "keyPoints": [
                "The Corporation is not liable for any indirect, special, or consequential damages (like lost profits or lost data).",
                "Their total financial liability to you for any claim is limited to a maximum of $100 or the amount you paid in the last six months, whichever is greater."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 19. USER INDEMNIFICATION MANDATE",
            "riskLevel": "high",
            "keyPoints": [
                "You agree to pay for the Corporation's legal defense (including attorneys' fees) if they are sued because of your misuse of the service or your breach of this agreement."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 20. DISPUTE RESOLUTION BY MANDATORY BINDING ARBITRATION",
            "riskLevel": "high",
            "keyPoints": [
                "You agree not to sue the Corporation in a court of law.",
                "All disputes must be resolved through binding arbitration in Delaware, administered by JAMS."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 21. WAIVER OF CLASS ACTION AND JURY TRIAL",
            "riskLevel": "high",
            "keyPoints": [
                "You explicitly give up your right to a trial by jury.",
                "You also give up your right to participate in any class-action lawsuit against the Corporation."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 22. GOVERNING LAW AND VENUE",
            "riskLevel": "low",
            "keyPoints": [
                "The agreement is governed by the laws of the State of Delaware."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 23. GENERAL PROVISIONS",
            "riskLevel": "low",
            "keyPoints": [
                "This document is the complete agreement between you and the Corporation.",
                "You cannot transfer your rights or obligations under this agreement to anyone else."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 24. NOTICES",
            "riskLevel": "low",
            "keyPoints": [
                "The Corporation can notify you of changes or other issues by sending you an email or posting a notice within the app.",
                "It's your responsibility to keep your email address up to date."
            ]
        },
        {
            "userFriendlyHeading": "SECTION 25. ENTIRE AGREEMENT",
            "riskLevel": "low",
            "keyPoints": [
                "This document is the complete and final agreement between you and the Corporation regarding the service.",
                "It overrides and replaces all previous or simultaneous agreements, discussions, or promises, whether they were spoken or written.",
                "The \"entire agreement\" also includes any future updates or additional terms you agree to while using the app."
            ]
        }
    ],
    topCategories: ["LIABILITY_AND_REMEDIES:50", "UNILATERAL_CHANGES:52", "CLASS_ACTIONS:55"],
    uncommonTerms: [
      { term: "Ab Initio", definition: "(Latin) \"From the beginning.\" Used to say something is void or invalid from the very start." },
      { term: "Cession", definition: "The act of formally giving up rights, property, or territory. In this context, it means you are ceding ownership of your content." },
      { term: "Commercialize", definition: "To manage or exploit something in a way designed to make a profit. Here, it refers to the company's right to sell your data." },
      { term: "Contemporaneous", definition: "Existing or occurring in the same period of time." },
      { term: "Covenants", definition: "Formal agreements or promises of a legal nature." },
      { term: "Decompile", definition: "To translate a program from machine code (what a computer reads) back into a higher-level language that a human can understand. It's a form of reverse engineering." },
      { term: "Disclaimer", definition: "A statement that denies something, especially responsibility." },
      { term: "Droit Moral", definition: "(French) \"Moral rights.\" In copyright law, this refers to an author's right to be credited for their work and to protect the work's integrity from distortion. The agreement asks you to waive these rights." },
      { term: "Expunge", definition: "To erase or remove completely." },
      { term: "Hereinafter", definition: "A formal word used in documents to mean \"from this point on.\"" },
      { term: "Indemnification / Indemnify", definition: "To compensate someone for harm or loss. In this agreement, you agree to pay for the company's legal costs if they are sued because of something you did." },
      { term: "Liability", definition: "The state of being legally responsible for something." },
      { term: "Perpetuity", definition: "For all time; forever." },
      { term: "Preamble", definition: "A preliminary or preparatory statement; an introduction." },
      { term: "Provisional Remedies", definition: "Temporary orders made by a court while a case is ongoing to protect a party from irreparable harm." },
      { term: "Revocable", definition: "Capable of being canceled or withdrawn." },
      { term: "Stipulations", definition: "Conditions or requirements that are demanded as part of an agreement." },
      { term: "Synergistically", definition: "In a way that the combined effect of two or more things is greater than the sum of their individual effects; working together to create an enhanced result." },
      { term: "Unambiguous", definition: "Not open to more than one interpretation; clear and precise." },
      { term: "Unequivocally", definition: "In a way that leaves no doubt." },
      { term: "Venue", definition: "The place where a legal case is heard." },
      { term: "Waive / Waiver", definition: "To voluntarily give up a right or claim." }
    ],
    terms: [
      { word: "waive", count: 92 },
      { word: "indemnify", count: 68 },
      { word: "liability", count: 65 },
      { word: "arbitration", count: 58 },
      { word: "damages", count: 54 },
    ],
  },
};
